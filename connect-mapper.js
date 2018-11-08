

$('.logout').click(function(e){
    firebase.auth().signOut();
    window.location.href = "index.html";
    return false;
});

// Initialize Firebase
var config = {
  apiKey: "AIzaSyCik1Jgz1IzJUs_GOVLHnIy3M25iKHEAg0",
  authDomain: "tornado-mapping.firebaseapp.com",
  databaseURL: "https://tornado-mapping.firebaseio.com",
  projectId: "tornado-mapping",
  storageBucket: "tornado-mapping.appspot.com",
  messagingSenderId: "400771346446"
};
firebase.initializeApp(config);

//crée fonction qui écrit les comments dans la DB
function addComment(commentId, comment, name, email, imageUrl) {
    firebase.database().ref('comments/' + commentId).set({
        commentId: commentId,
        comment: comment,
        sujet :sujet,
        username: name,
        email: email,
        profile_picture: imageUrl
    });
}

//on test présence de user co
//on affiche ou non le bouton de déconnexion
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        $('.profileinfos').show();
        $('.profileinfos .user').html('<div  class="profilepicture"><img src="' + user.photoURL + '" alt="' + user.displayName + '"></div><div class="username">' + user.displayName + '</div>');
    } else {
        $('.profileinfos').hide();
    }
});

function post() {
    let user = firebase.auth().currentUser;
    let name, email, photoUrl, comment, commentId;
    //récupérer données user
    name = user.displayName;
    email = user.email;
    photoUrl = user.photoURL;
    url  = $('textarea.commentbox').val();
    sujet = document.getElementById('sujet').value;


    var parsedStr = url.split("v=")[1];
    parsedStr = (parsedStr != undefined) ? parsedStr : url.split("youtu.be/")[1];
    var resultId = parsedStr.split("&")[0];

 console.log(resultId);
 comment = resultId

    commentId = firebase.database().ref().child('comments').push().key;




    //lancer addComment avec données récupérées
    addComment(commentId, comment, name, email, photoUrl);
    //on vide le texteare pour montrer que le commentaire est posté
    $('textarea.commentbox').val('');
    //on scroll up pour voir le new com
    $(location).attr('href',"#anchor-dos");
    //mettre à jour commentaires
    showComments();
}

//quand user clique sur submit
$('a.commentsubmit').click(function (e) {
    //tester si commentaire vide
    if ($('textarea.commentbox').val() == '') {
        console.log('fuck off');
    } else {
        //si pas connecté
        if (!firebase.auth().currentUser) {
            //on lance popup connexion
            console.log('Pas connectée');
            var provider = new firebase.auth.GoogleAuthProvider();

            firebase.auth().signInWithPopup(provider).then(function (result) {
                // This gives you a Google Access Token. You can use it to access the Google API.
                var token = result.credential.accessToken;
                // The signed-in user info.
                var user = result.user;
                // ...
            }).catch(function (error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                // The email of the user's account used.
                var email = error.email;
                // The firebase.auth.AuthCredential type that was used.
                var credential = error.credential;
                console.log('Fuck, ya erreur');
            });
            console.log('Connection');
        }
        //tentative de poster, soit si on était déjà connecté, soit après s'être connecté : échec du second cas de figure
        post();
    }
    return false;
//
});

//afficher les comments
function showComments() {
    $('.comments').html('');
    let comments = firebase.database().ref('comments/');
    comments.on('value', function (snapshot) {

        //console.log(snapshot.val());

        let contents = [];

        for (let entityId in snapshot.val()) {
            let content = snapshot.val()[entityId];
            contents.push(content);
        }

        let end = contents.length;
        if (end < 6){
            var start = 0;
        } else {
            var start = Math.floor(end - 70);
        }
        var newContents = contents.slice( start, end );
        //console.log(newContents);

        $.each(newContents, function() {
            //console.log(contents[i].comment);
            $('.comments').prepend('<div class="comment" id="' + this.commentId + '"><div  class="profilepicture"><img src="' + this.profile_picture + '" alt="' + this.username + '"></div><div class="username">' + this.username + '</div><div class="username">' + this.sujet + '</div><iframe width="600" height="315" src="https://www.youtube.com/embed/' + this.comment + '" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>');
        })
    });
}

showComments();


// ----------------------------------- KPI SA MERE -----------------------------------


/*

- Durée visionnage section :
    -> in JS :  A chaque session
                    au survol de chaque section
                        on lance un timer
                        et on envoie le résultat
    -> in DB :  section1Time : [00:00]
                section2Time : [00:00]
                section3Time : [00:00]

- Si section 2 et section 3 vues :
    -> in JS :  A chaque session,
                    si section1Time == 00:00
                        = false,
                    sinon
                        = true
    -> in DB :  section1Hover : true/false
                section2Hover : true/false
                section3Hover : true/false

- Pourcentage du site vu :
    -> in JS :  A chaque session
                    si section3Hover == true,
                        = 100%
                    else if section3Hover == false && section2Hover == true
                        = 66,666%
                    else if section2Hover == false
                        = 33,333%
    -> in DB : visitTime : 33,333%/66,666%/100%

- Taux d'abandon
    -> in JS : nb de visitTime = 100% en %
    -> in DB : /

- Nombre de visionnages vidéo :
    -> in JS :  A chaque session
                    on relève nombre clics
    -> in DB : videoClick : [0]

- Temps visionnage vidéo :
    -> in JS :  A chaque session
                    au click video
                        timer
                        var TIME = (temps total - temps calculé)%
                        si TIME >= 100%
                            = 100%
                        sinon si TIME >= 75%
                            = 75%
                        sinon si TIME = 50%
                            = 50%
                        sinon si TIME >= 25%
                            = 25%
                        sinon
                               = 0%
    -> in DB : videoWatch : 0%/25%/50%/75%/100%

- Nb de logins :
    -> in JS :  A chaque new user
                    +1
    -> in DB : logins : [0]

 */





//Durée visionnage section
$(window).on('load', function() {

    //Timer hover sections
    var sectionTime = 0;
    var sectionHover = 'false';
    var visitTime = '33,333%';

    //Le conde suivant marchait mais je n'ai pas trouvé comment isoler ces infos dans 3 variables distinctes pour chacune des sections (boucle avec i ?)

    //$('.section').mouseenter(function(){
    //    console.log($(this//));
    //    var timer = window.setInterval(function(){
    //        sectionTime++;
    //        $('.kpi').html(sectionTime);
    //    }, 1000);
    //    $(this).mouseleave(function(){
    //        clearInterval(timer);
    //    });
    //    $(window).on('unload', function(){
    //        clearInterval(timer);
    //    });

    //    if (sectionTime > 0){
    //        sectionHover = 'true';
    //    }
    //      console.log(section3Hover)

    //      Pourcentage site visionnage
    //      var visitTime = '33,333%';
    //      if (section3Hover == 'true') {
    //          visitTime = '100%';
    //      } else if (section3Hover == 'false' && section2Hover == 'true'){
    //          visitTime = '66,666%';
    //      }
    //      console.log(visitTime);
    //});

    var videoClick = 0;
    $('.videoplay').on('click', function(){
        videoClick++;
        //console.log(videoClick);
    });

    let sessions = firebase.database().ref('sessions/');
    sessions.on('value', function (snapshot) {

        let contentsS = [];

        for (let entityId in snapshot.val()) {
            let contentS = snapshot.val()[entityId];
            contentsS.push(contentS);
        }
        var last = contentsS.length;
        //console.log(last);
        //var sessionId = ++last;

        //Crée entrée SESSION in DB :
        //addSession(sessionId, sectionTime, sectionTime, sectionTime, sectionHover, sectionHover, sectionHover, visitTime, videoClick, 'nope', 'nope' );

        //HAHA YA RIEN QUI MARCHE kill me

    });

});
