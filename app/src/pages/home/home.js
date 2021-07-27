import { mapState } from 'vuex'
import { servicesPages } from '@/http'
import * as storage from '@/modules/auth/storage'
import io from 'socket.io-client'
import { mapActions } from 'vuex'
import Vue from 'vue'
import CiaoVuePopup from 'ciao-vue-popup'
Vue.use(CiaoVuePopup)
const Web3 = require('web3');

let web3 = new Web3("wss://ropsten.infura.io/ws/v3/e65d2b87026c469492121f8843769738");

var chatABI = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "b",
        "type": "uint256"
      }
    ],
    "name": "getTeste",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_idUsuario",
        "type": "string"
      },
      {
        "name": "_nomeUsuario",
        "type": "string"
      },
      {
        "name": "_mensagem",
        "type": "string"
      }
    ],
    "name": "resgistraEncaminhamento",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "getHorario",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "constructor"
  }
];
var chatDapp;
var chatAddress;


export default {
  name: 'Home',
  components: {
  },
  data() {
    return {
      currentState: {
        message: '',
        contact: {},
        searchContacts: ''
      },
      imageDefaultUser: 'images/icon-user-default.png',
      more: 'images/more.png',
      allContacts: [],
      contacts: [],
      profile: {},
      socket: io(process.env.VUE_APP_ROOT_API),
      numberNotifications: 0, 
      menssagemEncaminhada:''


    }
  },
  created() {
    this.getContacts()
    this.getDataProfile()
    this.authenticateUser()
    this.socketsEvents()
    this.getInvitations()
  },
  start() {

    if (typeof web3 !== 'undefined') {

      web3 = new Web3(web3.currentProvider);
    } else {
      web3 = new Web3(new Web3.providers.HttpProvider("wss://ropsten.infura.io/ws/v3/e65d2b87026c469492121f8843769738"));
    }

    chatAddress = "0xCadFaC75eD3CB04C4F9D9111D9C80B2b6fFddF4B";
    chatDapp = new web3.eth.Contract(chatABI, chatAddress);

  },
  methods: {
    ...mapActions('auth', ['ActionSignOut']),
    signOut() {
      this.ActionSignOut()
      this.$router.push({ name: 'login' })
    },
    notity() {
      let audio = new Audio('audio/notify-001.mp3');
      audio.addEventListener('canplaythrough', function () {
        window.console.log('deu play')
        audio.play();
      });
    },
    getInvitations() {
      servicesPages.pages.invitations({})
        .then(res => {
          const invitations = res.data
          for (const index in invitations) {
            const invite = invitations[index]

            const newUserConvide = {
              invitation: true,
              description: 'invitation',
              id_contact: invite.contact_id,
              name: invite.name,
              picture: invite.picture,
              notification: true
            }

            this.addNewInvite(newUserConvide)
          }
        })
        .catch(err => window.console.log(err))
    },
    getUrlImage(urlImage) {
      return process.env.VUE_APP_ROOT_API + '/' + urlImage
    },
    acceptInvite(user) {
      servicesPages.pages.acceptInvite({ id_contact: user.id_contact })
        .then(() => {
          this.currentState.contact = {}
          this.getContacts()
          this.getInvitations()
        })
        .catch((err) => { window.console.log(err) })
    },
    rejectInvite(user) {
      servicesPages.pages.rejectInvite({ id_contact: user.id_contact })
        .then(() => {
          this.currentState.contact = {}
          this.getContacts()
          this.getInvitations()
        })
        .catch(() => { })
    },
    addNewInvite(newUserConvide) {
      let existsInvitation = false
      for (const index in this.allContacts) {
        const contact = this.allContacts[index]
        if (contact.id_contact == newUserConvide.id_contact)
          existsInvitation = true
      }

      if (!existsInvitation)
        this.allContacts.push(newUserConvide)
    },
    searchInContacs() {
      this.contacts = []
      for (const index in this.allContacts) {
        const contact = this.allContacts[index]
        if (contact.name.toLowerCase().indexOf(this.currentState.searchContacts.toLowerCase()) !== -1) {
          this.contacts.push(contact)
        }
      }
    },
    loadAllContacts() {
      this.contacts = this.allContacts
    },
    goToPage(pageName) {
      this.$router.push({ name: pageName })
    },
    clearTextarea() {
      this.$refs.emoji.clear()
    },
    scrollEnd() {
      setTimeout(function () {
        document.querySelector(".messages").scrollTop = document.querySelector(".messages").scrollHeight !== null ? document.querySelector(".messages").scrollHeight : 0
      })
    },
    updateTitle() {
      if (this.numberNotifications > 0) {
        document.title = `(${this.numberNotifications}) - FortyTeam`
      } else {
        document.title = `FortyTeam`
      }
    },
    socketsEvents() {
      this.socket.on('messages', data => {
        for (const key in this.contacts) {
          const currentContact = this.contacts[key]
          if ((currentContact !== undefined) && (data.id_contact === currentContact.id_contact)) {
            if (currentContact.talks.length) {
              currentContact.talks.push({ method: 'replies', message: data.message })
            } else {
              this.getMessages(currentContact, () => {
                currentContact.talks.push({ method: 'replies', message: data.message })
              })
            }
            if (this.currentState.contact.id_contact === currentContact.id_contact) {
              this.scrollEnd()
            } else {
              this.notity()
              currentContact.notification = true
              this.numberNotifications++
              this.updateTitle()
            }
          }
        }
      })

      this.socket.on('typing', data => {
        for (const key in this.contacts) {
          const currentContact = this.contacts[key]
          if ((currentContact !== undefined) && (data.id_contact === currentContact.id_contact)) {
            if (this.currentState.contact.id_contact === currentContact.id_contact) {
              this.currentState.contact.typing = data.typing
            }
            setTimeout(() => { this.currentState.contact.typing = false }, 3000)
          }
        }
      })

      this.socket.on('adduser', data => {
        const newUserConvide = {
          invitation: true,
          description: 'invitation',
          id_contact: data.id_contact,
          name: data.name,
          picture: data.picture,
          notification: true
        }

        this.addNewInvite(newUserConvide)
      })

      this.socket.on('connect', () => {
        this.authenticateUser()
      })
    },
    authenticateUser() {
      const dataAuth = {
        token: 'Bearer ' + storage.getLocalToken()
      }
      this.socket.emit('authenticate', dataAuth);
    },
    changeTalk(contact) {
      if (!contact.invitation) {
        if (!contact.talks.length) {
          this.getMessages(contact)
        }

        if (contact.notification) {
          this.numberNotifications = 0
          this.updateTitle()
          contact.notification = false
        }

      }
      this.currentState.contact = contact
      this.scrollEnd()
    },
    getDataProfile() {
      servicesPages.pages.profile()
        .then(res => {
          this.profile = res.data.profile
        })
        .catch(err => {
          console.log(err)
        })
    },
    getContacts() {
      this.contacts = []
      this.allContacts = []
      servicesPages.pages.contactslist()
        .then(res => {
          this.allContacts = res.data.contacts
          this.loadAllContacts()
        })
        .catch(err => {
          console.log(err)
        })
    },
    getMessages(contact, callBackFunction) {
      this.talks = []
      servicesPages.pages.messages({ contactId: contact.id_contact })
        .then(res => {
          contact.talks = res.data.talks

          if (callBackFunction)
            callBackFunction()

          this.scrollEnd()
        })
        .catch(err => {
          console.log(err)
        })
    },
    newMessage() {
      if (this.currentState.message.trim() == '') {
        return false;
      }

      if (Object.keys(this.currentState.contact).length === 0) {
        return false;
      }

      const token = 'Bearer ' + storage.getLocalToken()

      this.currentState.contact.talks.push({ method: 'sent', message: this.currentState.message })
      this.scrollEnd()

      const actionClient = {
        id_contact: this.currentState.contact.id_contact,
        message: this.currentState.message,
        token: token,
        actionType: 'messages'
      }
      this.currentState.message = ''
      this.socket.emit('actionClient', actionClient);
    },
    sendTyping() {
      const token = 'Bearer ' + storage.getLocalToken()
      const actionClient = {
        id_contact: this.currentState.contact.id_contact,
        message: '',
        token: token,
        actionType: 'typing'
      }

      this.socket.emit('actionClient', actionClient);
    },
   
    encaminhar(perfil, contact) {

      if (this.menssagemEncaminhada.trim() == '') {
        return false;
      }

      if (Object.keys(contact).length === 0) {
        return false;
      }

      console.log(perfil);
      document.getElementById("myForm").style.display = "none";

      const token = 'Bearer ' + storage.getLocalToken()

      contact.talks.push({ method: 'sent', message: this.menssagemEncaminhada })
      this.currentState.contact = contact;
      this.changeTalk(this.currentState.contact);
      this.scrollEnd()

      const actionClient = {
        id_contact: contact.id_contact,
        message: this.menssagemEncaminhada,
        token: token,
        actionType: 'messages'
      }
      this.menssagemEncaminhada = ''
      this.socket.emit('actionClient', actionClient);

      //window.alert(window.ethereum.isConnected().toString());
      //web3.eth.defaultAccount = perfil.idCarteira;

      // var a = chatDapp.methods;
      //var a = chatDapp.methods.getTest(12).call({ from: web3.eth.defaultAccount });
      // window.alert(a);
      //this.carimbaChat(contact.name, perfil.full_name, this.currentState.message );


    },
    carimbaChat(recebeu, enviou, mensagem) {
      // Isso vai demorar um pouco, então atualize a interface do usuário para que o usuário saiba
      // a transação foi enviada
      window.alert("Registrando no blockchain. Isso pode demorar um pouco ...");
      // Envie o tx para nosso contrato:
      return chatDapp.methods.resgistraEncaminhamento(recebeu, enviou, mensagem)
        .send({ from: web3.eth.defaultAccount })
        .on("receipt", function (receipt) {
          console.log(receipt);
          window.alert("Registrado!");
        })
        .on("error", function (error) {
          // Faça algo para alertar o usuário sobre a falha da transação
          window.alert(error.message);
        });
    },

    openForm(message) {
      document.getElementById("myForm").style.display = "block";
      this.menssagemEncaminhada = message;
    },

    closeForm() {
      document.getElementById("myForm").style.display = "none";
    }


  },
  computed: {
    ...mapState('auth', ['user'])
  }
}