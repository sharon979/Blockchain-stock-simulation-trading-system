import firebase from 'firebase/compat/app';
//import React, { Component,useState } from 'react';
import {getDatabase, ref, set, update, push, child } from "firebase/database";
/*
function firebaseConfig(){
  const firebaseinfo={
      apiKey: "AIzaSyCDYFFgVkf6B6RBH-pTzyUVHum5KkFRA64",
      authDomain: "blockchain-8a257.firebaseapp.com",
      projectId: "blockchain-8a257",
      storageBucket: "blockchain-8a257.appspot.com",
      messagingSenderId: "294715817509",
      appId: "1:294715817509:web:7ce6c2c49ca51418e0c9cc",
      measurementId: "G-F2EPZ08VN8"
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseinfo);
      setdb(getDatabase);
      alert("success");
    }
}
*/
//export default firebaseConfig;
export const  connectfirebase=async()=>{
  const [db,setdb]=("");
  const firebaseinfo={
      /*
      apiKey: "AIzaSyCDYFFgVkf6B6RBH-pTzyUVHum5KkFRA64",
      authDomain: "blockchain-8a257.firebaseapp.com",
      projectId: "blockchain-8a257",
      storageBucket: "blockchain-8a257.appspot.com",
      messagingSenderId: "294715817509",
      appId: "1:294715817509:web:7ce6c2c49ca51418e0c9cc",
      measurementId: "G-F2EPZ08VN8"
      */
     
      apiKey: "AIzaSyA7BHjHS9v5GgKM79B530U2XSoJb3fbaow",
      authDomain: "blockchainstock-65b87.firebaseapp.com",
      databaseURL: "https://blockchainstock-65b87-default-rtdb.firebaseio.com",
      projectId: "blockchainstock-65b87",
      storageBucket: "blockchainstock-65b87.appspot.com",
      messagingSenderId: "172308721496",
      appId: "1:172308721496:web:f10dc4f41271b804b37f2d",
      measurementId: "G-K0FGJ4N45P"
      
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseinfo);
      setdb(getDatabase);
      alert("success");
      return db;
    }
    else{
      return false;
    }
};