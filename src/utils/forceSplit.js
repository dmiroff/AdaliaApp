// Принудительно разбиваем самые большие библиотеки
import('react').then(module => {
  console.log('React loaded in chunks');
});

import('react-dom').then(module => {
  console.log('ReactDOM loaded in chunks');  
});

import('mobx').then(module => {
  console.log('MobX loaded in chunks');
});

import('mobx-react-lite').then(module => {
  console.log('MobX React loaded in chunks');
});

// Разбиваем большие vendor библиотеки
import('axios').then(module => {
  console.log('Axios loaded in chunks');
});
