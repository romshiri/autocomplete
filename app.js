  Sentry.init({ dsn: 'https://10374adac3d542cfb76dd7c0922e0a01@o403657.ingest.sentry.io/5266545' });

    // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyCB5a2Y5U1_AnXddxNxhv8FXs4HPBTYpaQ",
    authDomain: "lastartup.firebaseapp.com",
    databaseURL: "https://lastartup.firebaseio.com",
    projectId: "lastartup",
    storageBucket: "lastartup.appspot.com",
    messagingSenderId: "345848977506",
    appId: "1:345848977506:web:b9197be39401501dcf593b",
    measurementId: "G-6HGY3M7F7B"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
function successAlert(text) {
  $('.alert-text').text(text);
  $('.success-alert').click();
}
  
function warningAlert(text) {
  $('.alert-text').text(text);
  $('.warning-alert').click();
}  
  
     function setUserProfile(userPhotoUrl) {
    if(userPhotoUrl) {
      localStorage && localStorage.setItem('userPhotoUrl', userPhotoUrl);      
    }

    let photoUrl = userPhotoUrl || localStorage && localStorage.getItem('userPhotoUrl');

    if(photoUrl) {
      $('.user-profile-image').attr('srcset', photoUrl);
    } else  {
      $('.user-profile-image').attr('srcset', 'https://uploads-ssl.webflow.com/5cefe161ab1c2846c19f43c9/5ec6cc7d893149b3c510ab8e_5da5c449bf24e4afe26c6290_you.png');
    }
  }
  
    async function createOrUpadteUser(uid, userInfo) {
  	try {
      let db = firebase.firestore();
      const userRef = db.collection('users').doc(uid);
      const user = await userRef.get();

      await userRef.set({...userInfo}, { merge: true });
    } catch(e) {
    	console.error(e);
    }
  }
    
   async function getCurrentUserData(uid) {
    let db = firebase.firestore();
    let user = await db.collection("users").doc(uid).get();
    let userData = user.data();
    if(!userData.email) {
      await createOrUpadteUser(user.id, { email: firebase.auth().currentUser.email });
    }
    return { ...userData, id: user.id };
  }


const mustSignInPages = ['/user/profile', '/co-founders/find','/kapara'];

var Webflow = Webflow || [];

Webflow.push(function () { 
  
  if(window.location.pathname === '/') {
   $('#homePageButton').hide();
   $('#addToButton').css('display', 'flex');
  }
  
  let searchParams = new URLSearchParams(window.location.search)

  if(searchParams.has('signed-out')) {
		warningAlert('עליך להתחבר קודם למערכת.')
  }
	
  
  $('.bg-block').css('backdrop-filter', 'blur(5px)');
  
  initApp();
  setUserProfile();
  
  function initApp() {
    firebase.auth().getRedirectResult().then(async function (result) {
      if(result && result.credential) {
        await signIn(result);
      }
    }).catch(function (error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      var email = error.email;
      var credential = error.credential;
      if (errorCode === 'auth/account-exists-with-different-credential') {
        alert('You have already signed up with a different auth provider for that email.');
      } else {
        console.error(error);
      }
    });
  }
	
  firebase.auth().onAuthStateChanged(async function(user) {
    if (user) {
      console.log('signed in with user: ' + user.uid);
      console.log('email: ' + user.email);
      try {
        Sentry.configureScope(scope => {
          scope.setUser({"email": user.email });
        });
      } catch(e) {
        console.log('sentry error');
      }
       $('#signout-button').show();
       $('#profile-button').show();
       $('#founders-button').show();
       $('#login-button').hide();
       setUserProfile(); 
    } else {
    		if(mustSignInPages.includes(window.location.pathname)) {
        	window.location.href = '/?signed-out=true';
          return;
       }
        
       $('#signout-button').hide();
       $('#profile-button').hide();
       $('#kapara-button').hide();
       $('#founders-button').hide();
       $('#login-button').show();
       localStorage && localStorage.removeItem('userPhotoUrl');
       setUserProfile();
    }
    
  });

  
    
	$('#founders-button').click(async function() { 
    let userData = await getCurrentUserData(firebase.auth().currentUser.uid);
    if(userData.cofoundersFinderEnabled) {
    	window.location.href = '/co-founders/find';
    } else {
      window.location.href = '/founder-finder';
    }
  });
  
	$('#signout-button').click(async function() { 
	  	 await firebase.auth().signOut();
       successAlert(`התנתקת מהמערכת בהצלחה!`);
       console.log('User sign-out!');
  });
  
  $('.sign-in-with-google').click(function() {
	  var provider = new firebase.auth.GoogleAuthProvider();
    
    if(isMobile()) {
    	firebase.auth().signInWithRedirect(provider);
    } else {
      firebase.auth().signInWithPopup(provider).then(async function(result) {      
        await signIn(result);
      }).catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorMessage);
      });   
    }

	});
  

  async function onBoardingFinish() {
   var type = '';

    if($('#cb-tech').prop("checked")) {
      type = 'tech';
    }
    if($('#cb-design').prop("checked")) {
      type = 'design';
    }
    if($('#cb-marketing').prop("checked")) {
      type = 'marketing';
    }
    if($('#cb-investments').prop("checked")) {
      type = 'investments';
    }
    if($('#cb-consulting').prop("checked")) {
      type = 'consulting';
    }
    if($('#cb-other').prop("checked")) {
      type = 'other';
    }

    let currentUserId = firebase.auth().currentUser.uid;
    createOrUpadteUser(currentUserId, { type, email: firebase.auth().currentUser.email });

    let searchParams = new URLSearchParams(window.location.search)

    shouldRedirect();
    
    $('.onboarding').fadeOut();
    successAlert(`קיבלנו! אתם בפנים. ⚡️`);

  }
  
  function shouldRedirect() {
    let searchParams = new URLSearchParams(window.location.search)

    if(searchParams.has('redirect')) {
      let redirect = searchParams.get('redirect');
      window.location.href = decodeURIComponent(redirect);
    } 
  }
  
  
  $('.user-type-container .cb-user-type').click(function() {
			setTimeout(() => {
	      onBoardingFinish();
      }
      , 400)
  });
  
  
  $(".user-type-container .cb-simple").change(function() {
    if(this.checked) {
      $(this).parent().css('border-color', '#19c5a4');
    } else {
      $(this).parent().css('border-color', '#d0d1d6');
    }
	});
  
  $('.user-type-container .cb-simple').on('change', function() {
    let otherCheckboxes = $('.user-type-container .cb-simple').not(this);
    otherCheckboxes.prop('checked', false);
    otherCheckboxes.parent().css('border-color', '#d0d1d6');
	});
  
  async function signIn(result) {
  	  let token = result.credential.accessToken;
      let user = result.user;
			let { given_name, family_name } = result.additionalUserInfo.profile;
      let isNewUser = result.additionalUserInfo.isNewUser;
      
      successAlert(`התחברתם למערכת!`);
      
      if(isNewUser) {
        $('.loginmodal, .loginblock').hide();        
        $('.onboarding').css('display', 'flex');
        $('#onboarding-user-name').text(given_name);
        await createOrUpadteUser(user.uid, { 
            firstName: given_name,
            lastName: family_name || '',
            email: user.email,
            photoUrl: user.photoURL || '',
        });

      } else {
        $('.loginmodal, .loginblock').fadeOut();
        let userData = await getCurrentUserData(user.uid);
      	setUserProfile(userData.photoUrl);
        shouldRedirect();
        return;
      }
      
      let userData = await getCurrentUserData(user.uid);
      setUserProfile(userData.photoUrl);
  }
  
  
  function isMobile() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };
  
  
});
