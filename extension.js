class Strings1 {
  getInfo() {
    return {
      id: 'strings1example',
      name: 'Encoding',
      blocks: [
        {
          opcode: 'convert',
          blockType: Scratch.BlockType.REPORTER,
          text: 'convert [TEXT] to [FORMAT] [FORMAT2]',
          arguments: {
            TEXT: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Apple'
            },
            FORMAT: {
              type: Scratch.ArgumentType.STRING,
              menu: 'FORMAT_MENU',
            },
            FORMAT2: {
              type: Scratch.ArgumentType.STRING,
              menu: 'FORMAT_MENU2',
            }
          }
        }
      ],
      menus: {
        FORMAT_MENU: {
          acceptReporters: false,
          items: ['uppercase', 'lowercase', 'capitalize']
        },
        FORMAT_MENU2: {
          acceptReporters: true,
          items: [
            {
              text: 'UPPERCASE',
              value: 'up'
            },
            {
              text: 'lowercase',
              value: 'low'
            }
            ]
        }
      }
    };
  }

  convert (args) {
    console.log(args.FORMAT2);
    
    if (args.FORMAT === 'uppercase' || args.FORMAT === 'capitalize') {
      // Notice the toString() call: TEXT might be a number or boolean,
      // so we have to make sure to convert it to a string first so that
      // it has a toUpperCase() function, otherwise we will get an error!
      // Remember: the argument's "type" is just a suggestion for the
      // editor; it's never enforced.
      return args.TEXT.toString().toUpperCase();
    } else {
      return args.TEXT.toString().toLowerCase();
    }
  }
}
Scratch.extensions.register(new Strings1());