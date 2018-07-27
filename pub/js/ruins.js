
import * as Input from "/js/input_handler.js";

console.log(Input.keymap);

function wireKeys () {
   window.addEventListener(
      'keypress',
      function(e) {
         var dispatch = Input.keymap[Input.fsm.state];

         if (dispatch && dispatch[e.key]) {
            Input.fsm[dispatch[e.key]]();
         }
      }
   );
}

function run () {
   Input.fsm.start();
}

wireKeys(); // why doesn't this work inside of run()?

export { run };
