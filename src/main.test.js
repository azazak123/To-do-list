beforeAll(async function () {
  // NOTE: nearlib and nearConfig are made available by near-cli/test_environment
  const near = await nearlib.connect(nearConfig);
  window.accountId = nearConfig.contractName;
  window.contract = await near.loadContract(nearConfig.contractName, {
    viewMethods: ["get_todo_list"],
    changeMethods: [],
    sender: window.accountId,
  });

  window.walletConnection = {
    requestSignIn() {},
    signOut() {},
    isSignedIn() {
      return true;
    },
    getAccountId() {
      return window.accountId;
    },
  };
});

test("get_todo_list", async () => {
  const message = await window.contract.get_todo_list({
    account_id: window.accountId,
  });
  expect(message[0]).toEqual("List is empty");
});
