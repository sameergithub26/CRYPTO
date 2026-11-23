// VERSION v3. Edit freely. types: mcq | odd | num | match.  k = answer (index / number / array of indexes). s = seconds.
// hard:true = crew lead may "Risk it": x2 points if right, -300 if wrong.  boss:true = class-wide boss round.
module.exports=[
{t:'mcq',tp:'Intro to cryptography',q:'Which kind of attack only listens to messages without changing them?',o:['Replay attack','Passive attack','Masquerade','Denial of service'],k:1,s:20},
{t:'match',tp:'Intro to cryptography',q:'Match each term with its meaning',l:['Plaintext','Ciphertext','Key','Cryptanalysis'],r:['Scrambled output','Secret value that controls the cipher','Breaking a cipher without the key','Readable input'],k:[3,0,1,2],s:30},
{t:'odd',tp:'Intro to cryptography',q:'Odd one out?',o:['Confidentiality','Integrity','Firewall','Availability'],k:2,s:20},
{t:'mcq',tp:'Caesar cipher',q:'Which shift value turns the Caesar cipher into ROT13?',o:['3','7','13','26'],k:2,s:15},
{t:'mcq',tp:'Caesar cipher',q:'Caesar cipher with shift 3: encrypt HI',o:['KL','LK','JK','KM'],k:0,s:25},
{t:'mcq',tp:'Caesar cipher',q:'Why is the Caesar cipher easy to break?',o:['Only 25 possible keys','It uses a very long key','It needs a supercomputer','It uses numbers only'],k:0,s:20},
{t:'mcq',tp:'Substitution cipher',q:'Why is a polyalphabetic cipher (like Vigenère) stronger than a Caesar cipher?',o:['It uses fewer letters','The same plaintext letter can become different ciphertext letters','It has no key','It only shifts by 1'],k:1,s:25},
{t:'mcq',tp:'Substitution cipher',q:'Frequency analysis works well against which cipher?',o:['Monoalphabetic substitution','One-time pad','AES','RSA'],k:0,s:20},
{boss:true,t:'mcq',tp:'Permutation cipher',q:'A permutation (transposition) cipher…',o:['Replaces letters with symbols','Rearranges letters without changing them','Uses a public key','Hashes the message'],k:1,s:20},
{t:'odd',tp:'Permutation cipher',q:'Odd one out?',o:['Rail Fence','Columnar transposition','Caesar','Route cipher'],k:2,s:25},
{hard:true,t:'mcq',tp:'Permutation cipher',q:'Rail Fence with 2 rails: encrypt HELLO (top row first, then bottom row)',o:['HLOEL','HELLO','OLLEH','ELHOL'],k:0,s:35},
{t:'mcq',tp:'Hill cipher',q:'The Hill cipher encrypts letters by…',o:['Shifting each letter','Matrix multiplication','Swapping columns','XOR with a keystream'],k:1,s:20},
{hard:true,t:'mcq',tp:'Hill cipher',q:'A Hill cipher key matrix must be…',o:['Invertible modulo 26','Symmetric','Filled with ones','Prime sized'],k:0,s:30},
{t:'num',tp:'Hill cipher',q:'A Hill cipher step gives 30. Reduce it mod 26.',k:4,s:25},
{t:'mcq',tp:'Block cipher',q:'A block cipher encrypts data…',o:['One bit at a time','In fixed-size chunks','Only in pairs of letters','Using a public key'],k:1,s:15},
{hard:true,t:'mcq',tp:'Block cipher',q:'A block cipher works on 64-bit blocks and your message is 100 bits. What must happen to the last block?',o:['The last block is thrown away','It is padded to 64 bits','It is sent unencrypted','The key is shortened'],k:1,s:30},
{t:'mcq',tp:'Stream cipher',q:'Why is it dangerous to reuse the same keystream for two messages?',o:['It makes encryption slower','It shortens the key','The two ciphertexts can be combined to cancel the keystream and leak information','Nothing bad happens'],k:2,s:30},
{boss:true,t:'mcq',tp:'Stream cipher',q:'A stream cipher usually combines plaintext with a keystream using…',o:['XOR','Division','Hashing','Rounding'],k:0,s:20},
{t:'odd',tp:'Block vs stream',q:'Odd one out?',o:['AES','DES','RC4','Blowfish'],k:2,s:25},
{t:'mcq',tp:'DES',q:'DES uses an effective key of how many bits?',o:['40','56','128','256'],k:1,s:20},
{t:'mcq',tp:'DES',q:'DES is built on which structure?',o:['Substitution-permutation network','Feistel','Lattice','Merkle tree'],k:1,s:20},
{t:'mcq',tp:'AES',q:'What is the AES block size?',o:['56 bits','64 bits','128 bits','256 bits'],k:2,s:20},
{hard:true,t:'match',tp:'AES',q:'Match each AES version with its number of rounds',l:['AES-128','AES-192','AES-256'],r:['14 rounds','10 rounds','12 rounds'],k:[1,2,0],s:35},
{t:'mcq',tp:'RSA',q:'RSA is which type of cipher?',o:['Symmetric','Asymmetric (public-key)','Stream','Transposition'],k:1,s:15},
{boss:true,t:'mcq',tp:'RSA',q:'RSA security relies on the difficulty of…',o:['Factoring a large number','Guessing a short password','Counting letters','Reversing a shift'],k:0,s:20}
];
