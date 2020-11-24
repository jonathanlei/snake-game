/** Client-side of groupchat. */

const ws = new WebSocket(`ws://docker.joelburton.net:3000/change_this_to_something_random`);

/** Handle connection from a user. */

ws.onopen = function (evt) {
  console.log("open", evt);
  // user has connected
};


/** called when msg received from server; displays it. */

ws.onmessage = function (evt) {
  console.log("message", evt);

  let msg = JSON.parse(evt.data);

  // THIS IS WHERE YOU WANT TO ADD CODE --- the `msg` will be an object w/a
  // move and the id of the user who made that move (1 is first player, 2 is second, etc)
  console.log(msg);
};


/** called on error; logs it. */

ws.onerror = function (evt) {
  console.error(`err ${evt}`);
};


/** called on connection-closed; logs it. */

ws.onclose = function (evt) {
  console.log("close", evt);
};


/** send message when button pushed. */

$("button").on("click", function (evt) {
  evt.preventDefault();

  let data = {move: evt.target.id}
  ws.send(JSON.stringify(data));
});

