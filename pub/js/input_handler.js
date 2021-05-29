
var RuinsOf1985InputHandler = (() => {

   const keymap = {
      start: {
         "c": "create",
         "f": "form",
         "g": "go"
      },
      "choose-adventure": {
         "b": "back"
      }
   };

   var fsm = null;

   function wireKeys () {
      window.addEventListener(
         'keypress',
         function(e) {
            const dispatch = keymap[fsm.state];

            if (dispatch && dispatch[e.key]) {
               fsm[dispatch[e.key]]();
            }
         }
      );
   }

   function showScreen (name) {
      hideScreens();
      document.getElementById(name + "-screen").style.display = "inline-block";
   }

   function showMenu (name) {
      hideMenus();
      document.getElementById(name + "-menu").style.display = "inline-block";
   }

   function hideAll (name) {
      Array.prototype.slice.call(
         document.getElementsByClassName(name)
      ).forEach( function (screen) {
         screen.style.display = "none";
      });
   }

   function hideScreens () {
      hideAll("screen");
   }

   function hideMenus () {
      hideAll("menu");
   }

   function startState () {
      // switch screen and menu
      // wire up keys
      console.log("Start");
      showScreen("start");
      showMenu("start");
   }

   function createAdventurerState () {
      console.log("Create Adventurer");
   }

   function saveAdventurerState () {

   }

   function formPartyState () {
      console.log("Form a Party");
   }

   function savePartyState () {

   }

   function chooseAdventureState () {
      console.log("Choose your own adventure!");
      hideScreens();
      showScreen("game-main");
   }

   function startFSM() {
      // Not every button click needs to change state.
      // May be no need for save-adventurer et al.

      fsm = new StateMachine({
         init: 'start',
         transitions: [
            { name: "create",  from: "start",  to: "create-adventurer" },
            { name: "form",    from: "start",  to: "form-party"        },
            { name: "go",      from: "start",  to: "choose-adventure"  },
            { name: "back",    from: [ "create-adventurer", "form-party", "choose-adventure" ],  to: "start" },
            { name: "save",    from: "create-adventurer",  to: "save-adventurer" },
            { name: "save",    from: "form-party",         to: "save-party" },
         ],
         methods: {
            onStart: startState,
            onCreateAdventurer: createAdventurerState,
            onFormParty: formPartyState,
            onChooseAdventure: chooseAdventureState
         }
      });

      wireKeys();
   }

   return {
      startFSM: startFSM
   };

})();
