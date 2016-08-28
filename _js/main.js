
const typewriter = require('typewriter-js');

document.addEventListener('DOMContentLoaded', () => {
  typewriter.prepare('.typewriter');
  typewriter.type('.typewriter', {
    duration: 1000,
  });
});
