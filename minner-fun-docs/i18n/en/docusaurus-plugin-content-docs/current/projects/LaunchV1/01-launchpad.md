Launchpad Platform
Project introduction: A token sale platform covering project teams funding their tokens, the platform configuring sale parameters, and investors registering and purchasing.
Each individual token sale contract is created by the factory contract.
factory contract: The factory contract, used to create sale contracts. It provides standard queries on the state of sale creations.
sale contract: The platform sets the basic sale information, such as registration time, sale time, token amount, maximum number of participants, etc.
Authorization is done via off-chain signing and on-chain signature verification.
Once the sale is complete, the project team withdraws the sale proceeds and any unsold tokens.

allocationStacking: A pre-sale staking contract. Users stake the platform token to obtain a purchase allocation. Then, at registration time, an unlock time is set for that user; before registering, users can withdraw at any time.

Off-chain: computing sale allocations, running the lottery, and signing.
