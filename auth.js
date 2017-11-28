// Firebase Auth
function initApp() {

  var reload = false;

  firebase.auth().onAuthStateChanged(function(user) {


    var loginObject = JSON.parse(localStorage.getItem('loginObject'));

    if (loginObject == null) {
      reload = true;
      console.log("Reload Needed");
    }

    if (user) {
      // User is signed in.
      var displayName = user.displayName;
      var email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var uid = user.uid;
      var phoneNumber = user.phoneNumber;
      var providerData = user.providerData;
      user.getIdToken().then(function(accessToken) {
        var account_details = JSON.stringify({
          displayName: displayName,
          email: email,
          emailVerified: emailVerified,
          phoneNumber: phoneNumber,
          photoURL: photoURL,
          uid: uid,
          accessToken: accessToken,
          providerData: providerData
        }, null, '  ');

        localStorage.setItem('loginObject', account_details);

        if (reload) {
          window.location.href = "options.html";
        }

        if (loginObject.displayName != JSON.parse(account_details).displayName) {
          console.log("Reload Needed");
          window.location.href = "options.html";
        }



      });
    } else {
      // User is signed out.
      var account_details = null;
      localStorage.setItem('loginObject', account_details);
      window.location.href = "index.html";
    }
  }, function(error) {
    console.log(error);
  });
}

// Init auth on load web page
window.addEventListener('load', function() {
  initApp()
});

// Logout of current account
function logout() {
  firebase.auth().signOut().then(function() {
    console.log('Signed Out');
    window.location.href = "index.html";
  }, function(error) {
    console.error('Sign Out Error', error);
  });
}
