<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

const { find } = useStrapi()
const mail = useMail()

// 1. Récupération des motifs de contact (contact-reasons)
const { data: reasonsResponse } = await useAsyncData('contact-reasons', () =>
  find('contact-reasons') // Adapte si le nom de ta collection est différent (ex: contact-reason)
)
const reasons = computed(() => reasonsResponse.value?.data || [])

// 2. État du formulaire
const form = reactive({
  name: '',
  pronouns: '',
  reasonId: null as number | null,
  subject: '',
  message: '',
  contactmail: '',
  phone: '',
})

// États pour la pièce jointe
const attachmentBase64 = ref<string | null>(null)
const attachmentName = ref<string>('')
const attachmentSize = ref<string>('')

// États pour l'UI (chargement, succès, erreur)
const isSubmitting = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')

// 3. Gestion de la pièce jointe (Conversion en Base64 pour nuxt-mail)
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    // Vérification de la taille (Optionnel : limite à 5Mo ici)
    if (file.size > 5 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (5Mo maximum).")
      target.value = ''
      return
    }

    attachmentName.value = file.name
    attachmentSize.value = (file.size / 1024 / 1024).toFixed(2) + ' Mo'

    const reader = new FileReader()
    reader.onload = (e) => {
      // Le résultat est une Data URL (ex: data:image/png;base64,iVBORw0K...)
      // C'est exactement ce que demande Nodemailer/Nuxt-mail pour la propriété "path"
      attachmentBase64.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  } else {
    attachmentBase64.value = null
    attachmentName.value = ''
  }
}

const removeAttachment = () => {
  attachmentBase64.value = null
  attachmentName.value = ''
  // Reset de l'input type="file" visuel
  const fileInput = document.getElementById('file-upload') as HTMLInputElement
  if (fileInput) fileInput.value = ''
}

// 4. Soumission du formulaire
// 4. Soumission du formulaire
// 4. Soumission du formulaire
// 4. Soumission du formulaire
// 4. Soumission du formulaire
// 4. Soumission du formulaire (AVEC DEBUG COMPLET)
const submitForm = async () => {
  if (!form.reasonId) {
    console.error("DEBUG: Aucun motif sélectionné !");
    return;
  }
  
  isSubmitting.value = true;
  submitStatus.value = 'idle';

  console.log("=== DÉBUT DU DEBUG EMAIL ===");

  try {
    // --- CHECK 1 : L'objet Raison ---
    const selectedReason = reasons.value.find(r => r.id === form.reasonId);
    console.log("CHECK 1 - Motif trouvé dans Strapi :", selectedReason ? selectedReason.raison : 'NON TROUVÉ');
    console.log("CHECK 1 - Mails bruts de Strapi :", {
      mail1: selectedReason?.mail1,
      mail2: selectedReason?.mail2,
      mail3: selectedReason?.mail3,
      mail4: selectedReason?.mail4
    });

    // --- CHECK 2 : Construction de la liste interne ---
    let internalEmails: string[] = [];
    if (selectedReason) {
      if (selectedReason.mail1) internalEmails.push(selectedReason.mail1);
      if (selectedReason.mail2) internalEmails.push(selectedReason.mail2);
      if (selectedReason.mail3) internalEmails.push(selectedReason.mail3);
      if (selectedReason.mail4) internalEmails.push(selectedReason.mail4);
    }

    if (internalEmails.length === 0) {
      console.warn("DEBUG: Aucun mail dans Strapi, utilisation du mail par défaut.");
      internalEmails.push('contact@le-girofard.org');
    }

    // Retirer les doublons internes
    internalEmails = [...new Set(internalEmails)];
    console.log("CHECK 2 - Liste des mails internes (BCC) dédupliquée :", internalEmails);

    // --- CHECK 3 : Formatage STRICT pour Nodemailer ---
    // Nodemailer préfère "mail1@x.com, mail2@x.com" plutôt que ["mail1@x.com", "mail2@x.com"]
    const bccString = internalEmails.join(', ');
    const toString = form.contactmail || 'contact@le-girofard.org';
    
    console.log("CHECK 3 - Formatage Nodemailer :");
    console.log(" -> TO (Utilisateur) :", toString);
    console.log(" -> BCC (Équipe) :", bccString);

    // --- CHECK 4 : Le contenu ---
    const textBody = `
Bonjour, nous vous confirmons la bonne réception de votre message. 
L'équipe du Girofard va vous répondre dans les meilleurs délais. 

Rappel des informations :
- Nom / Prénom : ${form.name}
- Pronoms : ${form.pronouns || 'Non précisé'}
- Motif : ${selectedReason?.raison || 'Non précisé'}
- Mail de contact : ${form.contactmail || 'Non précisé'}
- Numéro de téléphone : ${form.phone || 'Non précisé' }

Message :
${form.message}
    `;

    // --- CHECK 5 : Création de l'objet d'envoi final ---
    const mailOptions: any = {
      to: toString, 
      bcc: bccString,
      replyTo: form.contactmail,
      subject: `[Contact Site] ${form.subject}`,
      text: textBody,
    };

    if (attachmentBase64.value) {
      mailOptions.attachments = [{
        filename: attachmentName.value,
        path: attachmentBase64.value 
      }];
      console.log("CHECK 5 - Pièce jointe attachée :", attachmentName.value);
    }

    // ON AFFICHE LE PAYLOAD FINAL AVANT ENVOI
    console.log("=== PAYLOAD ENVOYÉ À NUXT-MAIL ===", JSON.parse(JSON.stringify(mailOptions)));

    // ON LANCE L'ENVOI
    console.log("Envoi en cours vers le interne...");
    await $fetch('/api/contact', {
      method: 'POST',
      body: mailOptions
    });

    const response = await $fetch('/api/contact', { // <--- Ajout de "const response ="
      method: 'POST',
      body: mailOptions
    });
    
    console.log("Réponse du serveur :", response);

    // Succès
    submitStatus.value = 'success';
    form.name = '';
    form.pronouns = '';
    form.reasonId = null;
    form.subject = '';
    form.message = '';
    form.contactmail = '';
    form.phone = '';
    removeAttachment();
    console.log("=== FIN DU DEBUG : SUCCÈS ===");

  } catch (error) {
    console.error("=== FIN DU DEBUG : ERREUR CRITIQUE ===");
    console.error(error);
    submitStatus.value = 'error';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div>
    <section class="">
    <div class="py-24 md:py-32 bg-[#D8D8FF] bg-no-repeat bg-cover">
      <div class="px-4 lg:px-0 max-w-6xl mx-auto">
        <h1 class="text-5xl md:text-6xl font-black max-w-xl text-black">
          Nous contacter
        </h1>
        <p class="text-md md:text-lg mt-8 text-black max-w-lg">
          Avec toutes les activités du Girofard, il existe multiples raisons de nous contacter. Choisis ta raison et écrit ton message, on y répondra dans les meilleurs délais.
        </p>
      </div>
    </div>
  </section>

    <section class="py-20 ">
      <div class="max-w-3xl mx-auto px-4 lg:px-0">
          
          
          <div class="bg-[#F5FEF6] border-black/20 border p-8 md:p-12 rounded-[10px] border border-gray-100">
            <h2 class="text-2xl font-semibold text-zinc-900 mb-6 py-4">Formulaire de contact</h2>
          
          <div v-if="submitStatus === 'success'" class="bg-green-50 border border-green-200 text-green-800 p-6 rounded-[10px] mb-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-xl font-bold mb-2">Message envoyé avec succès !</h3>
            <p>Notre équipe a bien reçu votre demande et vous répondra très rapidement.</p>
            <button @click="submitStatus = 'idle'" class="mt-6 text-green-700 font-semibold hover:underline">
              Envoyer un autre message
            </button>
          </div>

          <div v-else-if="submitStatus === 'error'" class="bg-red-50 border border-red-200 text-red-800 p-6 rounded-[10px] mb-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-xl font-bold mb-2">Oups, une erreur s'est produite.</h3>
            <p>Votre message n'a pas pu être envoyé. Veuillez réessayer ou nous contacter directement par mail.</p>
            <button @click="submitStatus = 'idle'" class="mt-6 px-6 py-2 bg-red-100 rounded-[10px] text-red-700 font-semibold hover:bg-red-200">
              Réessayer
            </button>
          </div>

          <form v-else @submit.prevent="submitForm" class="space-y-6">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label for="name" class="block text-sm font-semibold text-zinc-700">Prénom / Nom *</label>
                <input 
                  v-model="form.name" 
                  type="text" 
                  id="name" 
                  required 
                  class="w-full px-4 py-3 rounded-[10px] border border-gray-200 focus:ring-2 focus:ring-[#78E0AF] focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="Comment doit-on vous appeler ?"
                />
              </div>

              <div class="space-y-2">
                <label for="pronouns" class="block text-sm font-semibold text-zinc-700">Pronoms</label>
                <input 
                  v-model="form.pronouns" 
                  type="text" 
                  id="pronouns" 
                  class="w-full px-4 py-3 rounded-[10px] border border-gray-200 focus:ring-2 focus:ring-[#78E0AF] focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="Ex: Elle, Iel, Il/lui..."
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label for="contactmail" class="block text-sm font-semibold text-zinc-700">Adresse mail *</label>
                <input 
                  v-model="form.contactmail" 
                  type="text" 
                  id="name" 
                  required 
                  class="w-full px-4 py-3 rounded-[10px] border border-gray-200 focus:ring-2 focus:ring-[#78E0AF] focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="Où est-ce qu'on peut vous écrire ?"
                />
              </div>

              <div class="space-y-2">
                <label for="phone" class="block text-sm font-semibold text-zinc-700">Numéro de téléphone</label>
                <input 
                  v-model="form.phone" 
                  type="text" 
                  id="phone" 
                  class="w-full px-4 py-3 rounded-[10px] border border-gray-200 focus:ring-2 focus:ring-[#78E0AF] focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="+33 0X XX XX XX XX"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label for="reason" class="block text-sm font-semibold text-zinc-700">Pour quelle raison nous contactez-vous ? *</label>
              <select 
                v-model="form.reasonId" 
                id="reason" 
                required
                class="w-full px-4 py-3 rounded-[10px] border border-gray-200 focus:ring-2 focus:ring-[#78E0AF] focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white appearance-none cursor-pointer"
              >
                <option :value="null" disabled>Sélectionnez un motif...</option>
                <option v-for="reason in reasons" :key="reason.id" :value="reason.id">
                  {{ reason.raison }}
                </option>
              </select>
            </div>

            <div class="space-y-2">
              <label for="subject" class="block text-sm font-semibold text-zinc-700">Objet du message *</label>
              <input 
                v-model="form.subject" 
                type="text" 
                id="subject" 
                required 
                class="w-full px-4 py-3 rounded-[10px] border border-gray-200 focus:ring-2 focus:ring-[#78E0AF] focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="Sujet de votre demande"
              />
            </div>

            <div class="space-y-2">
              <label for="message" class="block text-sm font-semibold text-zinc-700">Votre message *</label>
              <textarea 
                v-model="form.message" 
                id="message" 
                rows="6" 
                required 
                class="w-full px-4 py-3 rounded-[10px] border border-gray-200 focus:ring-2 focus:ring-[#78E0AF] focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white resize-y"
                placeholder="Détaillez votre demande ici..."
              ></textarea>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-zinc-700">Pièce jointe (Optionnel)</label>
              
              <div v-if="!attachmentBase64" class="relative">
                <input 
                  type="file" 
                  id="file-upload" 
                  @change="handleFileUpload" 
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div class="w-full px-4 py-4 rounded-[10px] border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center gap-3 text-gray-500 hover:border-[#78E0AF] hover:bg-[#F5FEF6] transition-colors cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#14663E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span class="font-medium">Cliquer pour ajouter un fichier (Max 5Mo)</span>
                </div>
              </div>

              <div v-else class="w-full px-4 py-3 rounded-[10px] border border-[#78E0AF] bg-[#F5FEF6] flex items-center justify-between">
                <div class="flex items-center gap-3 overflow-hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#14663E] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span class="font-medium text-zinc-800 truncate">{{ attachmentName }}</span>
                  <span class="text-xs text-zinc-500">{{ attachmentSize }}</span>
                </div>
                <button type="button" @click="removeAttachment" class="text-red-500 hover:text-red-700 p-1 flex-shrink-0" title="Retirer la pièce jointe">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="pt-4">
              <button 
                type="submit" 
                :disabled="isSubmitting"
                class="w-full md:w-auto inline-flex justify-center items-center gap-2 rounded-[10px] px-8 py-4 bg-[#78E0AF] text-black font-semibold hover:bg-[#14663E] hover:text-white active:scale-95 transition-all transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <svg v-if="isSubmitting" class="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isSubmitting ? 'Envoi en cours...' : 'Envoyer mon message' }}
              </button>
            </div>

          </form>
        </div>

      </div>
    </section>
  </div>
</template>