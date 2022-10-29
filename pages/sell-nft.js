import { Form, useNotification, Button } from "web3uikit";
import { ethers } from "ethers";
import nftMarketplaceAbi from "../constants/NftMarketplace.json";
import nftAbi from "../constants/BasicNft.json";
import { useMoralis, useWeb3Contract } from "react-moralis";
import networkMapping from "../constants/networkMapping.json";
import { useState, useEffect } from "react";

export default function Home() {
    const { chainId, account, isWeb3Enabled } = useMoralis();
    const chainString = chainId ? parseInt(chainId).toString() : "31337";
    const marketplaceAddress = networkMapping[chainString].NftMarketplace[0];
    const dispatch = useNotification();
    const { runContractFunction } = useWeb3Contract();
    const [proceeds, setProceeds] = useState("0");
    //const [buttonState, setButtonState] = useState(0);

    async function approveAndList(data) {
        console.log("Approving...");

        const nftAddress = data.data[0].inputResult;
        const tokenId = data.data[1].inputResult;
        const price = ethers.utils.parseUnits(data.data[2].inputResult, "ether").toString();

        const approveOptions = {
            abi: nftAbi,
            contractAddress: nftAddress,
            functionName: "approve",
            params: {
                to: marketplaceAddress,
                tokenId: tokenId,
            },
        };

        await runContractFunction({
            params: approveOptions,
            onSuccess: () => handleApproveSuccess(nftAddress, tokenId, price),
            onError: (error) => {
                console.log(error);
            },
        });
    }

    async function approveIt(data) {
        console.log("Approving...");
        console.log("data:", data.data);
        const nftAddress = data.data[0].inputResult;
        const tokenId = data.data[1].inputResult;
        const price = ethers.utils.parseUnits(data.data[2].inputResult, "ether").toString();

        const approveOptions = {
            abi: nftAbi,
            contractAddress: nftAddress,
            functionName: "approve",
            params: {
                to: marketplaceAddress,
                tokenId: tokenId,
            },
        };

        await runContractFunction({
            params: approveOptions,
            onSuccess: () => {
                dispatch({
                    type: "success",
                    message: "NFT approved",
                    title: "NFT approved",
                    position: "topR",
                });
            },
            onError: (error) => {
                console.log(error);
            },
        });
    }

    async function listIt(data) {
        console.log("Listing NFT...");
        console.log("data:", data.data);
        const nftAddress = data.data[0].inputResult;
        const tokenId = data.data[1].inputResult;
        const price = ethers.utils.parseUnits(data.data[2].inputResult, "ether").toString();

        const listOptions = {
            abi: nftMarketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "listItem",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
                price: price,
            },
        };

        await runContractFunction({
            params: listOptions,
            onSuccess: () => handleListSuccess(),
            onError: (error) => console.log(error),
        });
    }

    async function handleApproveSuccess(nftAddress, tokenId, price) {
        console.log("Listing NFT...");
        const listOptions = {
            abi: nftMarketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "listItem",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
                price: price,
            },
        };

        await runContractFunction({
            params: listOptions,
            onSuccess: () => handleListSuccess(),
            onError: (error) => console.log(error),
        });
    }

    async function handleListSuccess() {
        dispatch({
            type: "success",
            message: "NFT listing",
            title: "NFT listed",
            position: "topR",
        });
    }

    const handleWithdrawSuccess = () => {
        dispatch({
            type: "success",
            message: "Withdrawing proceeds",
            position: "topR",
        });
    };

    async function setupUI() {
        const returnedProceeds = await runContractFunction({
            params: {
                abi: nftMarketplaceAbi,
                contractAddress: marketplaceAddress,
                functionName: "getProceeds",
                params: {
                    seller: account,
                },
            },
            onError: (error) => console.log(error),
        });
        if (returnedProceeds) {
            setProceeds(returnedProceeds.toString());
        }
    }

    useEffect(() => {
        setupUI();
    }, [proceeds, account, isWeb3Enabled, chainId]);

    let buttonState = 0;
    return (
        <div>
            <Form
                onSubmit={buttonState === 1 ? approveIt : listIt}
                data={[
                    {
                        name: "NFT Address",
                        type: "text",
                        inputWidth: "50%",
                        value: "",
                        key: "nftAddress",
                    },
                    {
                        name: "Token ID",
                        type: "number",
                        value: "",
                        key: "tokenId",
                    },
                    {
                        name: "Price (ETH)",
                        type: "number",
                        value: "",
                        key: "price",
                    },
                ]}
                customFooter={
                    <div style={{ display: "flex" }}>
                        <Button
                            size="regular"
                            text="Approve it"
                            theme="primary"
                            type="submit"
                            onClick={() => (buttonState = 1)}
                            // onClick={approveIt}
                        />
                        <Button
                            size="regular"
                            text="List it"
                            theme="secondary"
                            type="submit"
                            onClick={() => (buttonState = 2)}
                            //onClick={listIt}
                        />
                    </div>
                }
                title="Sell you NFT"
                id="main-form"
            ></Form>
            <div>Withdraw {proceeds} proceeds</div>
            {proceeds != "0" ? (
                <Button
                    onClick={() => {
                        runContractFunction({
                            params: {
                                abi: nftMarketplaceAbi,
                                contractAddress: marketplaceAddress,
                                functionName: "withdrawProceeds",
                                params: {},
                            },
                            onError: (error) => console.log(error),
                            onSuccess: () => handleWithdrawSuccess,
                        });
                    }}
                    text="Withdraw"
                    type="button"
                />
            ) : (
                <div>No proceeds detected</div>
            )}
        </div>
    );
}
