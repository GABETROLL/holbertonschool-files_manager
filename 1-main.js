console.log('0');
import dbClient from './utils/db';
console.log('1');

function waitConnection() {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < 10000000; i++) {
      if (dbClient.isAlive()) {
        reslove('OK');
        return;
      }
    }
    reject('Not OK');
  });
}

console.log('2');

console.log(dbClient.isAlive());

console.log('3');

waitConnection()
  .then(async (result) => {
    console.log('4');
    console.log(dbClient.isAlive());
    console.log(await dbClient.nbUsers());
    console.log(await dbClient.nbFiles());
    console.log('5');
  })
  .catch((error) => console.log(`ERROR: ${error}`));
