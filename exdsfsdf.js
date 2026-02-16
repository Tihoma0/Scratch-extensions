(function(Scratch) {
  'use strict';
class Strings1 {
  getInfo() {
    return {
      id: 'strings1example',
      name: 'Encoding',
      blocks: [
        {
          opcode: 'convert',
          blockType: Scratch.BlockType.REPORTER,
          text: 'dosomething',
          
        }
      ],
      
    };
  }

  convert (args, util) {
    return util.target.getName();
  }
}
Scratch.extensions.register(new Strings1());
})(Scratch);