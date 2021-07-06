![Printess Logo](PrintessLogoS.png)

# Getting Started

This repo shows how easy it is to get started with the printess editor.

You can test the iframe based integration running here:
<https://printesseditor.github.io/getting-started/index.html>



## &nbsp;


# Embedding the Printess Editor

Printess editor can easily embeded as an iframe:

```html
<iframe  id="printess" src="https://editor.printess.com/printess-editor/embed.html"></iframe>
```

## Attach the editor 

Once the DOM is loaded you will need to pass some  essential parameters, like your shop-token, the name of the template and your session or basket ID. 

```html
iframe.contentWindow.postMessage({
    cmd: "attach", properties: {

      /* Paste your Printess shop-token here */
      token: "", // 
      
      /* Name of the template to load. You can also pass a save-token from "basket" or "back" callback here to load previously saved work. */
      templateName: "Greeting Card", 

      /* A unique ID to identify this session, can later be used to connect to a UserID once the user has logged in or createdan account */
      basketId: "Some-Unique-Basket-Or-Session-Id",

      /* Optional if available: the ID of the current shop-user to keep all uploaded resources together and display for reccuring users */ 
      shopUserId: properties.shopUserId,
      
      /* Optional: you custom CSS or a Bootstrap Theme */
      cssUrl: window.location.origin + "/bootstrap-themes/sketchy.css", 

      /* Optional: List of one or more templates to merge on load */
      /* mergeTemplates: [
        {
          "templateName": "Card-Title-2",
          "spreadIndex": 0  // Example to merge a card title to the first spread on load 
        },
        {
          "templateName": "Card-Back-2",
          "spreadIndex": 2  // Example to merge a card back to the third spread on load 
        }
      ], */
    }
  }, "*");
}

```

## Process the callbacks

To continue the shopping journey Printess will give you two essential callbacks:

**back**, when the users presses the back button

**basket** when the user wants to continue buy the configured product

Both callbacks give you a so called **save-token** which you easily can store in your database and later use to either **print** the saved confuguration or **load** the saved work again to the Printess editor and allow the users to continue their work.

```html
window.addEventListener("message", () => {
  switch (event.data.cmd) {

    case "back":
      alert("Back to catalog. save-token:" + event.data.token);
      break;

    case "basket":
      prompt("Proceed to checkout.\n\nsave-token:\n" + event.data.token + "\n\nThumbnailUrl:", event.data.thumbnailUrl);
      break;

    case "formFieldChanged":
      /* You can react to changes of price-relevant form fields here */
      const msg = document.getElementById("message");
      msg.style.display = "flex";
      msg.textContent = "Form Field: [" + event.data.name + "] changed to '" + event.data.value + "'";
      setTimeout(() => document.getElementById("message").style.display = "none", 2000);
  }
});
```
A third callback is **formFieldChanged** which is helpful if the user changes certain configuration which has been marked as **price-relevant**. Depending on the resulting value you can  adjust the price of the product. 

## Congratulations!


You now know everything to get started with the Printess Editor. Have fun and please let us know if you struggle. 

### Please find more documentation in the [Printess Knowledge Base](https://printess.com/kb/api-reference/js-api/getting-started.html) 




# Custom integration of the Printess Editor

If at any point you feel that the iframe integration lacks some kind of flexibility you can allways switch to a **Custom Integration**.

All the work you have done to make the iframe look like your website will stil work, since custom integration is doing the exact same thing like the iframe way - but you can customize much further. 

You can test the custom integration here:
<https://printesseditor.github.io/getting-started/custom.html>

Custom integration comes with a **uiHelper.js** file which does all of the ui-work you already familiar with from the iframe-integration.

It uses teh Printess-JS-Api to communicate with tzhe editor.

**uiHelper.js** is also available as a typescript version and we provide you with a **d.ts** file for the Printess-JS API.



Printess can still be easily be loaded from our CDN.

Be aware that Printess itself is loaded after the webcomponents polyfills. So first we need to load **webcomponentjs** from the Printess CDN.

```html
<script src="https://editor.printess.com/node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
```

Now we wait for **WebComponentsReady** before loading Printess itself.

```html
<script>
  window.WebComponents = window.WebComponents || {
    waitFor(cb) {
      addEventListener('WebComponentsReady', cb);
    },
  };
  let printess;
  let api;
  WebComponents.waitFor(async () => {
    printess = await import(
      'https://editor.printess.com/printess-editor/printess-editor.js'
    );

    api = printess.attachPrintess({
      resourcePath: 'https://editor.printess.com/printess-editor', // needs to be always set
      domain: 'api.printess.com',
      div: document.getElementById('printess'),
      basketId: 'CurrentShopBasketId',
      shopUserId: 'CurrentShopCustomerId',
      token: 'YOUR TOKEN',
      showBuyerSide: true,
      templateName: 'Sign',
    });
  });
</script>
```

The `attachPrintess` call initializes Printess, passes the authentication token and the name of the template to be loaded.

Please be aware that you'll need to tell Printess the path to its resource files (Web-Assembly and Default Fonts) in a separate property `resourcePath`. Please do not change this value.

The `domain` should remain unchanged. It only needs to be changed if you are uing a private Printess cloud.

In the `div` property you need to pass a div-element which Printess Editor will attach to.
Printess is intended to have as much space as possible, so it is highly recommended to not leave space on left and right side. Especially on mobile.

`token` should be set to a **Shop-Token** which points to yout Printess Account. You can get this token once you are logged in in the Printess Editor -> Account Menu -> API-Token. You'll see 3 different tokens in the dialog. Please always use the **Shop-Token**.

Finally the variable named `printess` contains a **js-api** reference to the Printess editor.

If you use typescript you'll find a `printess-editor.d.ts` file in the repro which contains all types for the printess object.

## &nbsp;

## `basketId` and `shopUserId`

To enable your customer to upload images and to save or load the state of work - you need to pass in minimum a `BasketId` to printess on `attachPrintess()`.

Optionally you can pass a `shopUserId` to make Printess store in the context of the current customer (user). Also when the customer uploads an image it will be stored under the `shopUserId`. So if the customer returns later he or she will see its previous uploaded images.

```json
{
  "basketId": "CurrentShopBasketId",
  "shopUserId": "CurrentShopCustomerId"
}
```

We are working on a method to assign an existing `basketId` to a `shopUserId` in the case the user logs in after he or she has already designed his or her artwork. So you can ensure that even with late sign in or user creation the existing uploaded images are assigned to that customer.

[Find more information here]([https:/printess.com/kb/](https://printess.com/kb/user-manual/js-api.html))

## &nbsp;

## Store and Recall the Design Work

To store the result of what your customer has configured in Printess you can simply call `printess.saveJson()`. In return you will get a token that yu can easily use to load this state if the customer returns or want to make changes. You also can use this token to load the customers design from the admin-view to apply fixes you might have received via email or phone.

**Save customers work**

```js
const myToken = await printess.saveJson();
```

**Load customers work**

```js
await printess.loadJson(myToken);
```

To test it, we added a button in the toolbar **Save State**, which saves the current state and returns a token to load it later. Just try it, make some other changes or even load a different template, and then press **Load State**, paste the token to the prompt and you will see the state you prevoiusly stored.

## &nbsp;

### Please find more documentation in the [Printess Knowledge Base](https://printess.com/kb/api-reference/js-api/getting-started.html) 

