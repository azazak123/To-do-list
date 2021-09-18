import "regenerator-runtime/runtime";
import React from "react";
import { login, logout } from "./utils";
import "./global.css";

import getConfig from "./config";
const { networkId } = getConfig(process.env.NODE_ENV || "development");

export default function App() {
  // use React Hooks to store todoList in component state
  const [todoList, setTodoList] = React.useState([]);

  const [todoCheckList, setTodoCheckList] = React.useState([]);

  // when the user has not yet interacted with the form, disable the button
  const [buttonDisabled, setButtonDisabled] = React.useState(true);

  // after submitting the form, we want to show Notification
  const [showNotification, setShowNotification] = React.useState(false);

  React.useEffect(() => {
    if (window.walletConnection.isSignedIn()) {
      window.contract
        .get_todo_list({ account_id: window.accountId })
        .then((todoListFromContract) => {
          let todoList = [];
          let todoCheckList = [];
          todoListFromContract.map((arr) => {
            todoList.push(arr[0]);
            todoCheckList.push(arr[1]);
          });
          setTodoList(todoList);
          setTodoCheckList(todoCheckList);
        });
    }
  }, []);

  // if not signed in, return early with sign-in prompt
  if (!window.walletConnection.isSignedIn()) {
    return (
      <main>
        <h1>Welcome to my To do list on NEAR!</h1>
        <p>
          To make use of the app, you need to sign in. The button below will
          sign you in using NEAR Wallet.
        </p>
        {/* <p>
          By default, when your app runs in "development" mode, it connects to a
          test network ("testnet") wallet. This works just like the main network
          ("mainnet") wallet, but the NEAR Tokens on testnet aren't convertible
          to other currencies – they're just for testing!
        </p> */}
        <p>Go ahead and click the button below to try it out:</p>
        <p style={{ textAlign: "center", marginTop: "2.5em" }}>
          <button onClick={login}>Sign in</button>
        </p>
      </main>
    );
  }

  return (
    // use React Fragment, <>, to avoid wrapping elements in unnecessary divs
    <>
      <button className="link" style={{ float: "right" }} onClick={logout}>
        Sign out
      </button>
      <main>
        <h1>To do list for {window.accountId}!</h1>
        <form
          onSubmit={async (event) => {
            event.preventDefault();

            const { fieldset } = event.target.elements;

            // disable the form while the value gets updated on-chain
            fieldset.disabled = true;
            try {
              // make an update call to the smart contract
              await window.contract.set_todo_list({
                // pass the value that the user entered in the todoList field
                todo_list: todoList,
                todo_check_list: todoCheckList,
              });
            } catch (e) {
              alert(
                "Something went wrong! " +
                  "Maybe you need to sign out and back in? " +
                  "Check your browser console for more info."
              );
              throw e;
            } finally {
              // re-enable the form, whether the call succeeded or failed
              fieldset.disabled = false;
            }

            // show Notification
            setShowNotification(true);

            // remove Notification again after css animation completes
            // this allows it to be shown again next time the form is submitted
            setTimeout(() => {
              setShowNotification(false);
            }, 11000);

            setButtonDisabled(true);
          }}
        >
          <fieldset id="fieldset">
            <label
              htmlFor="todoList"
              style={{
                display: "block",
                color: "var(--gray)",
                marginBottom: "0.5em",
              }}
            >
              Change todoList
            </label>
            <div style={{ display: "flex", flexFlow: "column wrap" }}>
              {todoList.map((todoItem, index) => (
                <div key={index}>
                  <input
                    autoComplete="off"
                    defaultValue={todoItem}
                    data-key={index}
                    onChange={(e) => {
                      setButtonDisabled(false);
                      setTodoList(
                        todoList.map((todoItem, index) => {
                          return e.target.getAttribute("data-key") == index
                            ? e.target.value
                            : todoItem;
                        })
                      );
                    }}
                    style={{
                      width: "80%",
                      backgroundColor: todoCheckList[index]
                        ? "green"
                        : "inherit",
                    }}
                  />
                  <button
                    type="button"
                    data-key={index}
                    style={{ borderRadius: "0px" }}
                    onClick={(e) => {
                      setButtonDisabled(false);
                      setTodoList(
                        todoList.filter((_, index) =>
                          index == e.target.getAttribute("data-key")
                            ? false
                            : true
                        )
                      );
                      setTodoCheckList(
                        todoCheckList.filter((_, index) =>
                          index == e.target.getAttribute("data-key")
                            ? false
                            : true
                        )
                      );
                    }}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    data-key={index}
                    style={{ borderRadius: "0 5px 5px 0" }}
                    onClick={(e) => {
                      setButtonDisabled(false);
                      setTodoCheckList(
                        todoCheckList.map((isReady, index) =>
                          index == e.target.getAttribute("data-key")
                            ? !isReady
                            : isReady
                        )
                      );
                    }}
                  >
                    ✓
                  </button>
                </div>
              ))}
              <button
                type="button"
                style={{ borderRadius: "0 5px 5px 0" }}
                onClick={(_) => {
                  setTodoCheckList(todoCheckList.concat([false]));
                  setTodoList(todoList.concat([""]));
                }}
              >
                +
              </button>

              <button
                type="submit"
                disabled={buttonDisabled}
                style={{ borderRadius: "0 5px 5px 0" }}
              >
                Save
              </button>
            </div>
          </fieldset>
        </form>
      </main>
      {showNotification && <Notification />}
    </>
  );
}

// this component gets rendered by App after the form is submitted
function Notification() {
  const urlPrefix = `https://explorer.${networkId}.near.org/accounts`;
  return (
    <aside>
      <a
        target="_blank"
        rel="noreferrer"
        href={`${urlPrefix}/${window.accountId}`}
      >
        {window.accountId}
      </a>
      {
        " " /* React trims whitespace around tags; insert literal space character when needed */
      }
      called method: 'setTodoList' in contract:{" "}
      <a
        target="_blank"
        rel="noreferrer"
        href={`${urlPrefix}/${window.contract.contractId}`}
      >
        {window.contract.contractId}
      </a>
      <footer>
        <div>✔ Succeeded</div>
        <div>Just now</div>
      </footer>
    </aside>
  );
}
