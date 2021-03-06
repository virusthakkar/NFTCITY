"use strict";
const express = require('express')
const app = express()
const port = 3000
const fs = require("fs");
const meterify = require("meterify").meterify;
const Web3 = require("web3");
const web3 = meterify(new Web3(), "http://test.meter.io:8669");
app.get('/Create_Accounts', (req, res) => {
var accounts = createAccounts({"amit":{},"sumit":{}});
console.log(accounts);
res.send(accounts);
})

app.get('/Add_Accounts_To_Wallet', (req, res) => {
var accounts = createAccounts({"amit":{},"sumit":{}});
addAccountsToWallet(accounts);
console.log("Added Accounts "+accounts+" To Wallet");
res.send("Added Accounts "+accounts+" To Wallet");
})

app.get('/Send_MTR', (req, res) => {
send_MTR(req.query.from_acc, req.query.to_acc);
console.log('MTR sent from '+req.query.from_acc+' to '+req.query.to_acc);
res.send('MTR sent from '+req.query.from_acc+' to '+req.query.to_acc);
})
app.get('/Send_MTRG', (req, res) => {
send_MTRG(req.query.from_acc, req.query.to_acc);
console.log('MTRG sent from '+req.query.from_acc+' to '+req.query.to_acc);
res.send('MTRG sent from '+req.query.from_acc+' to '+req.query.to_acc);
})

app.get('/Load_Contract', (req, res) => {
var data = loadContract('sample_token.sol');
res.send(data);
})
app.get('/Deploy_Contract', (req, res) => {
deployContract(data,req.query.acc_address);
res.send("deployed contract");
})

/* This creates new accounts from an object, and adds the new accounts to the object.
*/

function createAccounts(accounts){
  console.log("Creating Accounts");
let key;
  for(key in accounts){
    accounts[key] = web3.eth.accounts.create();
    console.log("Account "+accounts[key].address+" Created.");
  }

  console.log("All Accounts Created");
  return accounts;
}

/* This adds the accounts to the wallet. */

function addAccountsToWallet(accounts){
  console.log("Adding Accounts to Wallet");

  for(var key in accounts){
    web3.eth.accounts.wallet.add(accounts[key].privateKey);
    console.log("Added Private Key "+accounts[key].privateKey+" to Wallet");
  }

  console.log("Added All Accounts to Wallet");
  //web3.eth.accounts.wallet;
  return;
}

/* This will send MTR from one address to another, using the account value.
 * The sending account therefore requires gas. This example does not yet
 * have functionality to do that.
*/

function send_MTR(fromAddress,toAddress){
  console.log("Sending MTR from "+fromAddress+" to "+toAddress);

  web3.eth.sendTransaction(
    {
      from: fromAddress,
      to: toAddress,
      value: '1000000000000000000',
      data: '0000000000'
    }
  ).then(
    receipt => {}
  ).then(
    data => {
      console.log("MTR sent from "+fromAddress+" to "+toAddress+" "+JSON.stringify(data));
      next();
    }
  ).catch(function(error){
    console.log("Error: "+error);
  });
}

/* This will send MTRG from one address to another, using the account value.
 * The sending account therefore requires gas. This example does not yet
 * have functionality to do that.
*/

function send_MTRG(fromAddress,toAddress){
    console.log("Sending MTRG from "+fromAddress+" to "+toAddress);

  web3.eth.sendTransaction(
    {
      from: fromAddress,
      to: toAddress,
      value: '1000000000000000000',
      data: '0000000001'
    }
  ).then(
    receipt => {}
  ).then(
    data => {
      console.log("MTRG sent from "+fromAddress+" to "+toAddress+" "+JSON.stringify(data));
      next();
    }
  ).catch(function(error){
    console.log("Error: "+error);
  });
}

/* This loads a smart contract from a file. */

function loadContract(file){
  console.log("Loading contract: "+file);
  const contractFile = fs.readFileSync(file).toString();
  const solc = require('solc');
  const compiledCode = solc.compile(contractFile);

  var data = {};

  data.token_abiDefinition = JSON.parse(compiledCode.contracts[':SAMPLEToken'].interface)
  let token_byteCode = compiledCode.contracts[':SAMPLEToken'].bytecode
  data.token_byteCode = "0x" + token_byteCode;

  console.log("Contract Loaded.");
  return data;
}

/* This deploys the smart contract. */

function deployContract(data,address){
  console.log("Deploying contract.");

  contractInstance = new web3.eth.Contract(data.token_abiDefinition)
  contractInstance.options.data = data.token_byteCode
  contractInstance.deploy(
    {
      arguments: [
        address,
        '1000000000',
        'Sample Token',
        '3',
        'STOKEN'
      ]
    }
  ).send(
    {
      from: address,
      gas: 4700000
    }
  ).then(
    (
      newContractInstance
    ) => {
      console.log("Contract deployed.");
      contractInstance.options.address = newContractInstance.options.address;
      registerEvents(contractInstance);
    }
  );
}

/* This allows events to be registered to the contract.
 * When a contract event occurs a log or error message
 * will be displayed in the console.
*/

function registerEvents(contractInstance){
  contractInstance.events.allEvents(
    {}, (error, result) => {
      if (error) {
          console.log(error)
      } else {
          contractReady(result,contractInstance);
      }
  })
}

/* This provides a place to start calling functions
 * for testing the smart contract.
 */

function contractReady(result,contractInstance){
  console.log(result);
  transferFrom(contractInstance, req.query.from_acc, req.query.to_acc);
}

/* This uses the smart contract methods for sending cryptocurrency
 * from one account to another.
 */

function transferFrom(contractInstance, fromAddress, toAddress){
  contractInstance.methods._transferFrom(
    fromAddress,
    toAddress,
    '9999'
  ).send(
    {
      from:fromAddress,
      gas: 4700000
    }
  ).then(
    data => {
      console.log(data)}
    ).catch(
      err => {console.log(err)}
  )
}

/* This uses the smart contract methods for requesting
 * account balances.
 */

function getAccountBalanceOf(contractInstance,address){
  contractInstance.methods.getAccountBalanceOf(
    address
  ).send(
    {
      from: address,
      gas: 4700000
    }).then(
      data => {
        console.log(data)
      }
    ).catch(err => {
      console.log(err)
    }
  )
}

/* This uses the smart contract methods for minting tokens.
 */

function mintToken(contractInstance,address){
  contractInstance.methods.mintToken(
    address,
    '99999999999999999999999'
  ).send(
    {
      from: 'some_address1',
      gas: 4700000
    }
  ).then(
    data => {
      console.log(data)
    }
  ).catch(
    err => {
      console.log(err)
    }
  )
}
;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})