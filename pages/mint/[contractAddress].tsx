import {
  HStack,
  VStack,
  Image,
  Text,
  Input,
  Button,
  Box,
  Spinner,
} from "@chakra-ui/react";
import styles from "@styles/Mint.module.css";
import { useRouter } from "next/router";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";

import communityNFT from "@data/CommunityNFT.json";
import { doc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import db from "@firebase/firebase";
import { useCallback, useEffect, useState } from "react";

const Mint = () => {
  const { address, isConnecting, isDisconnected } = useAccount();

  const router = useRouter();

  const [githubUsername, setGithubUsername] = useState<string>("");
  const [discordUsername, setDiscordUsername] = useState<string>("");
  const [uploadedLogoFile, setUploadedLogoFile] = useState<any>("");
  const [uploadedLogoURL, setUploadedLogoURL] = useState<string>("");
  const [transactionHash, setTransactionHash] = useState<string>("");

  const { contractAddress } = router.query;
  const nftAddress = contractAddress as string;
  // const loading = true;

  const { config } = usePrepareContractWrite({
    addressOrName: nftAddress
      ? nftAddress
      : "0x2E20684B8082aaeE594999324E154111d55b58bb",
    contractInterface: communityNFT.abi,
    functionName: "mint",
  });

  const { data: txn, isLoading, isSuccess, write } = useContractWrite(config);

  // const isLoading = true;

  const saveUserInfo = useCallback(
    async (
      contract: string,
      address: string,
      github: string,
      discord: string
    ) => {
      const contractRef = doc(db, "contracts", contract.toLowerCase());
      await updateDoc(contractRef, {
        users: arrayUnion(address.toLowerCase()),
      });

      const userRef = doc(db, "users", address.toLowerCase());
      await setDoc(userRef, {
        github: github,
        discord: discord,
        pscore: 0,
        dscore: 0,
        cscore: 0,
        lastUpdated: 0,
        createdAt: new Date().getTime(),
        address: address.toLowerCase(),
        rank: 1,
        tier: "Gold",
      });
    },
    []
  );

  const handleFileChange = (event: any) => {
    console.log("loaded file: ", event.target.files[0]);
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);
    setUploadedLogoURL(url);
    setUploadedLogoFile(event.target.files[0]);
  };

  useEffect(() => {
    async function saveDB() {
      if (isSuccess) {
        if (!address || !txn) return;
        const txnResponse = await txn.wait();
        console.log("txnResponse: ", txnResponse);
        setTransactionHash(txnResponse.transactionHash);
        await saveUserInfo(
          nftAddress,
          address.toLowerCase(),
          githubUsername,
          discordUsername
        );
      }
    }
    saveDB();
  }, [isSuccess]);

  const handleMint = async () => {
    await write?.();
  };

  const handleGithubInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const github = e.target.value;
      setGithubUsername(github);
    },
    []
  );

  const handleDiscordInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const discord = e.target.value;
      setDiscordUsername(discord);
    },
    []
  );

  if (!address) {
    return;
  }

  const disableButton = !write || !githubUsername || !discordUsername;

  const completed = true;

  return (
    <HStack className={styles.container}>
      <Image
        src={uploadedLogoURL ? "/nft3.png" : "/nft2.png"}
        alt="nft sample"
        cursor="pointer"
        className={styles.nft}
      ></Image>

      <VStack className={styles.mintContainer} gap={10}>
        <VStack>
          <Text className={styles.title}>Web3 Infinity Community NFT</Text>
          <Text className={styles.subtitle}>
            Note this Community NFT is a non-transferrable, soul-bound token.
          </Text>
        </VStack>
        {!isSuccess ? (
          <VStack className={styles.detailsSection}>
            <VStack className={styles.inputSection}>
              <Text className={styles.header}>Logo</Text>
              <HStack w="100%">
                <Box className={styles.logoNameSection}>
                  <Text color="white" fontSize=".7rem" opacity={0.7}>
                    {!uploadedLogoFile
                      ? "Please upload image with square dimensions."
                      : uploadedLogoFile.name}
                  </Text>
                </Box>
                <input
                  type="file"
                  id="logoInput"
                  accept="image/png, image/jpg"
                  onChange={handleFileChange}
                  className={styles.logoInput}
                />
              </HStack>
            </VStack>
            <VStack className={styles.inputSection}>
              <Text className={styles.header}>Github Username</Text>
              <Input
                className={styles.input}
                placeholder="@iamminci"
                onChange={handleGithubInput}
              />
            </VStack>

            <VStack className={styles.inputSection}>
              <Text className={styles.header}>Discord Username</Text>
              <Input
                className={styles.input}
                placeholder="@minci#4229"
                onChange={handleDiscordInput}
              />
            </VStack>
            <VStack className={styles.buttonSection}>
              <Button
                bgColor="#3A76F2"
                disabled={disableButton}
                onClick={handleMint}
                color="white"
                width="150px"
              >
                {isLoading ? <Spinner color="white" /> : "Mint Free NFT"}
              </Button>
            </VStack>
          </VStack>
        ) : (
          <VStack w="100%" className={styles.successSection}>
            <Text>Community NFT has been successfully minted!</Text>
            <a
              href={`https://rinkeby.etherscan.io/tx/${transactionHash}`}
              rel="noreferrer"
              target="_blank"
            >
              <Text>{`Etherscan: https://rinkeby.etherscan.io/tx/${abridgeAddress(
                transactionHash
              )}`}</Text>
            </a>
          </VStack>
        )}
      </VStack>
    </HStack>
  );
};

export function abridgeAddress(address?: string) {
  if (!address) return address;
  const l = address.length;
  if (l < 20) return address;
  return `${address.substring(0, 6)}...${address.substring(l - 4, l)}`;
}

export default Mint;
