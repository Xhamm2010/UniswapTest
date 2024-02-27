import { ethers } from "hardhat";
import { parseEther, parseUnits } from "ethers";

const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
    const USDCAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    const DAIAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
    const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    const ImpersonatedUserAddress = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";

    await helpers.impersonateAccount(ImpersonatedUserAddress);
    const impersonatedSigner = await ethers.getSigner(ImpersonatedUserAddress);

    const USDC = await ethers.getContractAt("IERC20", USDCAddress);
    const DAI = await ethers.getContractAt("IERC20", DAIAddress);
    const WETH = await ethers.getContractAt("IERC20", WETHAddress);

    const ROUTER = await ethers.getContractAt("IUniswap", UNIRouter);

    const approveUSDCTx = await USDC.connect(impersonatedSigner).approve(UNIRouter, parseUnits("500", 18));
    approveUSDCTx.wait()

    const ethBal = await impersonatedSigner.provider.getBalance(ImpersonatedUserAddress);
    const userWethBal = await WETH.balanceOf(impersonatedSigner.address);

    const usdcBal = await USDC.balanceOf(impersonatedSigner.address);

    console.log("WETH Balance:", ethers.formatUnits(userWethBal, 18));
    console.log("ETH Balance:",ethers.formatUnits(ethBal, 18));
    console.log("USDC Balance:", ethers.formatUnits(usdcBal, 6))

    const deadline = Math.floor(Date.now() / 1000 + (60*15));

    console.log("-------------------------------Adding liquidity----------------------------------")

    const liquidityTx = await ROUTER.connect(impersonatedSigner)
        .addLiquidityETH(USDCAddress, 20_000_000_000n, 100_000n,
        parseEther("2"), ImpersonatedUserAddress, deadline,
        {value: parseEther("2")});
    liquidityTx.wait()

    console.log("WETH Balance after adding liquidity:", ethers.formatUnits(await WETH.balanceOf(ImpersonatedUserAddress), 18));
    console.log("ETH Balance after adding liquidity:", ethers.formatUnits(await impersonatedSigner.provider.getBalance(ImpersonatedUserAddress), 18));
    console.log("USDC Balance after adding liquidity:", ethers.formatUnits(await USDC.balanceOf(ImpersonatedUserAddress), 6));


    console.log("-------------------------------Adding liquidity for ERC20-ERC20 pool----------------------------------")

    const approveWETHTx = await USDC.connect(impersonatedSigner).approve(UNIRouter, parseEther("50"));
    approveWETHTx.wait()

    const approveDAITx = await DAI.connect(impersonatedSigner).approve(UNIRouter, parseUnits("500", 18));
    approveDAITx.wait()


    const addLiquidityERC20Tx = await ROUTER.connect(impersonatedSigner)
        .addLiquidity(WETHAddress, DAIAddress, 400n, 200n,
        400n, 200n, ImpersonatedUserAddress, deadline);
    addLiquidityERC20Tx.wait()

    console.log("DAI Balance after adding liquidity:", ethers.formatUnits(await DAI.balanceOf(ImpersonatedUserAddress), 18));
    console.log("WETH Balance after removing liquidity:", ethers.formatUnits(await WETH.balanceOf(ImpersonatedUserAddress), 18));
}

main().catch((error) => {
    console.error(error);
    process.exit(1)
})