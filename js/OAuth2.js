 
import Portal from 'https://js.arcgis.com/4.23/@arcgis/core/portal/Portal.js'
import OAuthInfo from 'https://js.arcgis.com/4.23/@arcgis/core/identity/OAuthInfo.js'
import esriId from 'https://js.arcgis.com/4.23/@arcgis/core/identity/IdentityManager.js'

const appId = 'xG2kkVesAXGRx5t1' // AppId for arcgis-calcite-template (Dev folder at geodata.maps.arcgis.com) 

const info = new OAuthInfo({
  appId,
  flowType: "auto", // default that uses two-step flow
  popup: false
});

esriId.registerOAuthInfos([info]);

export const authenticate = () => {
  return new Promise((resolve, reject) => {
    esriId.checkSignInStatus(info.portalUrl + "/sharing").then(() => {
      const portal = new Portal() // User is signed in
      portal.authMode = "immediate"
      portal.load().then(() => {
        updateUIforSignOut(portal.user.thumbnailUrl)
        return resolve(portal)
      })
    }).catch(() => {
      updateUIforSignIn() // User is not signed in
      signIn()
      resolve()
    })
  })
}

const signIn = () => {
  esriId.getCredential(info.portalUrl + "/sharing")
}

const signOut = () => {
  updateUIforSignIn()
  esriId.destroyCredentials()
  window.location.reload()
}

const updateUIforSignOut = (thumbnailUrl) => {
  let avatar = document.createElement('calcite-avatar')
  avatar.thumbnail = thumbnailUrl
  
  let action = signInAction('signout-action', 'Logg ut')
  action.addEventListener('click', signOut)
  action.appendChild(avatar)
  
  updateSignInUI(action)
}

const updateUIforSignIn = () => {
  let action = signInAction('signin-action', 'Logg inn', true)
  action.addEventListener('click', signIn)
  updateSignInUI(action)
}

const signInAction = (id, text, textEnabled = false) => {
  let action = document.createElement('calcite-action')
  action.id = id
  action.text = text
  action.textEnabled = textEnabled
  if (textEnabled) action.icon = 'user'
  return action
}

const updateSignInUI = (action) => {
  let signIn = document.getElementById('signin')
  signIn.innerHTML = ''
  signIn.appendChild(action)
}
