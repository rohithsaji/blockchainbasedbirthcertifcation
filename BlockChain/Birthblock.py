
import datetime
import hashlib
import json
from flask import Flask, jsonify, request
import requests
from uuid import uuid4
from urllib.parse import urlparse


class Blkchain:
    

    def __init__(self):
        self.chain = []
        self.records = []
        self.create_blk(proof = 1, prev_hash = '0')
        self.nodes = set()
        self.rec_no = 1
    
    def create_blk(self, proof, prev_hash):
        block = {'index': len(self.chain) + 1,
                 'timestamp': str(datetime.datetime.now()),
                 'proof': proof,
                 'previous_hash': prev_hash,
                 'records': self.records}
        self.records = []
        self.rec_no = 1
        self.chain.append(block)
        return block

    def get_prev_blk(self):
        return self.chain[-1]

    def proof_of_work(self, prev_proof):
        new_proof = 1
        check_proof = False
        while check_proof is False:
            hash_operation = hashlib.sha256(str(new_proof**2 - prev_proof**2).encode()).hexdigest()
            if hash_operation[:4] == '0000':
                check_proof = True
            else:
                new_proof += 1
        return new_proof
    
    def hash(self, block):
        encoded_block = json.dumps(block, sort_keys = True).encode()
        return hashlib.sha256(encoded_block).hexdigest()
    
    def is_chain_valid(self, chain):
        previous_block = chain[0]
        block_index = 1
        while block_index < len(chain):
            block = chain[block_index]
            if block['previous_hash'] != self.hash(previous_block):
                return False
            previous_proof = previous_block['proof']
            proof = block['proof']
            hash_operation = hashlib.sha256(str(proof**2 - previous_proof**2).encode()).hexdigest()
            if hash_operation[:4] != '0000':
                return False
            previous_block = block
            block_index += 1
        return True
    
    def add_record(self, fname, lname, Location, dob, certifiedby, time):
        
        self.records.append({'Id': self.rec_no,
                            'First_Name': fname,
                             'Last_Name':lname,
                             'dob': dob,
                             'certifiedby': certifiedby,
                             'Location': Location,
                             'time': time})
        previous_block = self.get_prev_blk()
        self.rec_no += 1
        return previous_block['index'] + 1
     
        
    
    def add_node(self, address):
        parsed_url = urlparse(address)
        self.nodes.add(parsed_url.netloc)
    
    def replace_chain(self):
        network = self.nodes
        longest_chain = None
        max_length = len(self.chain)
        for node in network:
            response = requests.get(f'http://{node}/get_chain')
            if response.status_code == 200:
                length = response.json()['length']
                chain = response.json()['chain']
                if length > max_length and self.is_chain_valid(chain):
                    max_length = length
                    longest_chain = chain
        if longest_chain:
            self.chain = longest_chain
            return True
        return False

app = Flask(__name__)


node_address = str(uuid4()).replace('-', '')

blockchain = Blkchain()

# Mining a new block
@app.route('/mine_block', methods = ['GET'])
def mine_block():
    replace_chain()
    previous_block = blockchain.get_prev_blk()
    previous_proof = previous_block['proof']
    proof = blockchain.proof_of_work(previous_proof)
    previous_hash = blockchain.hash(previous_block)
    block = blockchain.create_blk(proof, previous_hash)
    response = {'message': 'Congratulations, you just mined a block!',
                'index': block['index'],
                'timestamp': block['timestamp'],
                'proof': block['proof'],
                'previous_hash': block['previous_hash'],
                'transactions': block['records']}
    return jsonify(response), 200

# Getting the full Blockchain
@app.route('/get_chain', methods = ['GET'])
def get_chain():
    response = {'chain': blockchain.chain,
                'length': len(blockchain.chain)}
    return jsonify(response), 200

# Function to check if hashes are valid
@app.route('/is_valid', methods = ['GET'])
def is_valid():
    is_valid = blockchain.is_chain_valid(blockchain.chain)
    if is_valid:
        response = {'message': 'All good. The Blockchain is valid.'}
    else:
        response = {'message': 'The Blockchain is not valid.'}
    return jsonify(response), 200

#function to add recorrds
@app.route('/add_record', methods = ['POST'])
def add_record():
    json = request.get_json()
    transaction_keys = ['fname','lname','Location','dob','certifiedby','time']
    if not all(key in json for key in transaction_keys):
        return 'Some elements of the transaction are missing', 400
    index = blockchain.add_record(json['fname'], json['lname'], json['Location'], json['dob'], json['certifiedby'], json['time'])
    response = {'message': f'This transaction will be added to Block {index}'}
    return jsonify(response), 201

def connect_node():
    json = request.get_json()
    nodes = json.get('nodes')
    if nodes is None:
        return "No node", 400
    for node in nodes:
        blockchain.add_node(node)
    response = {'message': 'All the nodes are now connected. The Hadcoin Blockchain now contains the following nodes:',
                'total_nodes': list(blockchain.nodes)}
    return jsonify(response), 201

@app.route('/get_record', methods = ['GET'])
def get_record():
    json = request.get_json()
    transaction_keys = ['index','Id']
    if not all(key in json for key in transaction_keys):
        return 'Some elements of the transaction are missing', 400
    if (int(json['index'])-1) >= len(blockchain.chain) or (int(json['Id'])-1) >= len(blockchain.chain[int(json['index'])-1]['records']):
        return 'invalid index sent', 400
    response = blockchain.chain[int(json['index'])-1]['records'][int(json['Id'])-1]
    return jsonify(response),200
    

# Replacing the chain by the longest chain if needed
@app.route('/replace_chain', methods = ['GET'])
def replace_chain():
    is_chain_replaced = blockchain.replace_chain()
    if is_chain_replaced:
        response = {'message': 'The nodes had different chains so the chain was replaced by the longest one.',
                    'new_chain': blockchain.chain}
    else:
        response = {'message': 'The chain is the largest one.',
                    'actual_chain': blockchain.chain}
    return jsonify(response), 200

# Running the app
app.run(host = '0.0.0.0', port = 5000)