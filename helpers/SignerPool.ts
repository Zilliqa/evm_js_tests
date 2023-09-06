import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Wallet} from "ethers";
import {ethers} from "hardhat";

export default class SignerPool {
  public static async getSignerForCurrentWorker(): Promise<SignerWithAddress> {
    const signers = await ethers.getSigners();
    let current_worker_id = 0;
    if (process.env.MOCHA_WORKER_ID) {
      current_worker_id = Number(process.env.MOCHA_WORKER_ID);
    }
    return signers[current_worker_id % signers.length];
  }

  public static createRandomAccount(): Wallet {
    return Wallet.createRandom().connect(ethers.provider);
  }

  public async takeSigner(): Promise<Wallet> {
    console.log("INIT0001");
    if (this.signers.length == 0) {
      // Need to create new signers
      console.log("INIT000");
      await this.initSigners();
    }

    return this.signers.pop()!;
  }

  public releaseSigner(...signer: Wallet[]) {
    this.signers.push(...signer);
  }

  private async initSigners() {
    const signer = await SignerPool.getSignerForCurrentWorker();
    const newSigners = Array.from({length: 10}, (v, k) => Wallet.createRandom().connect(ethers.provider));
    const BatchTransferContract = await ethers.getContractFactory("BatchTransfer");
    const batchTransfer = await BatchTransferContract.connect(signer).deploy({
      value: ethers.utils.parseUnits("321", "ether")
    });
    await batchTransfer.deployed();
    const addresses = newSigners.map((signer) => signer.address);
    console.log("batch tranferring...");
    let xx = await batchTransfer.batchTransfer(addresses, ethers.utils.parseUnits("12", "ether"));
    console.log("batch tranferring done(?)...", xx);
    await xx.wait();

    this.signers.push(...newSigners);
  }

  private signers: Wallet[] = [];
}
