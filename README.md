![Printess Logo](PrintessLogoS.png)

# Embedding the Printess editor to your site

In this getting started repo you can see various Printess integrations and you can test them live as well.  

You can test drive all sample codes directly on github:

<https://printesseditor.github.io/getting-started/index.html>

And you'll find more information in our [knowledge base](https://printess.com/kb/user-manual/js-api.html)

# iframe vs. custom integration

The easiest and recommended way is to embed the Printess editor with a iframe and pass your own CSS-file for ui customization. You should always start with this integration and you can always switch to the custom-ui if you need. The CSS approach and the DOM will stay the same, so you wont loose any of your work. With the iframe integration you rely on our buyer-side-ui and will get bugfixes and improvements automatically. If you went the custom route you basically check out the entire Printess buyer side code (uiHelper) and you can modify, change and extend it to your needs. Best way is to fork the uiHelper so you still see the improvements from the Printess team. 


# Embedd Printess editor as iframe

```html
<iframe  id="printess" src="https://editor.printess.com/printess-editor/embed.html"></iframe>
```

It's highly recommended to show the Printess editor iframe in full-screen. Especially on mobile the user experiences gets quirky if other elements are shown on top or below the editor. Space is extremly limited and to achive the app-feeling scrolling of the website should not happen - ever. When iOS is expanding its giant on-screen keyboard Printess will counter act this by hiding all toolbars and page navigation. And when the keyboard collapses Printess will get back to normal as well. This will only work if your page does not exceed the area of the iframe. 
If you like to handle this behaviour on your own of tweak the existing code, please have a look at the **custom integration** down below.

## Attaching the editor 

Once the DOM is loaded you will need to pass some  essential parameters, like your shop-token, the name of the template and your session or basket ID. 

```js
iframe.contentWindow.postMessage({
    cmd: "attach", properties: {

      /* Paste your Printess shop-token here */
      token: "", 
      
      /* Name of the template to load. You can also pass a save-token from "basket" or "back" callback here to load previously saved work. */
      templateName: "Greeting Card", 

      /* A unique ID to identify this session, can later be used to connect to a UserID once the user has logged in or createdan account */
      basketId: "Some-Unique-Basket-Or-Session-Id",

      /* Optional if available: the ID of the current shop-user to keep all uploaded resources together and display for reccuring users */ 
      shopUserId: properties.shopUserId,
      
      /* Optional: you custom CSS or a Bootstrap Theme */
      cssUrl: window.location.origin + "/bootstrap-themes/sketchy.css", 

      /* Optional: List of one or more templates to merge on load */
      mergeTemplates: [
        {
          "templateName": "Card-Title-2",
          "spreadIndex": 0  // Example to merge a card title to the first spread on load 
        },
        {
          "templateName": "Card-Back-2",
          "spreadIndex": 2  // Example to merge a card back to the third spread on load 
        }
      ],
    }
  }, "*");
}

```

## Listening to callbacks

To continue the shopping journey Printess will give you two essential callbacks:

**back**, when the users presses the back button

**basket** when the user wants to continue buy the configured product

Both callbacks give you a so called **save-token** which you easily can store in your database and later use to either **print** the saved confuguration or **load** the saved work again to the Printess editor and allow the users to continue their work.

```js
window.addEventListener("message", () => {
  switch (event.data.cmd) {

    case "back":
      alert("Back to catalog. save-token:" + event.data.token);
      break;

    case "basket":
      alert("Proceed to checkout. save-token:" + event.data.token + " thumbnailUrl:" +event.data.thumbnailUrl);
      break;

    case "formFieldChanged":
      alert("Price Relevant Form Field: [" + event.data.name + "] changed to '" + event.data.value + "'");
  }
});
```
A third callback is **formFieldChanged** which is helpful if the user changes certain configuration which has been marked as **price-relevant**. Depending on the resulting value you can  adjust the price of the product. 

## Congratulations!

You now know everything to get started with the Printess Editor. Have fun and please let us know if you struggle. 


## &nbsp;

## &nbsp;


# Custom Frontend Integration

If at any point you feel that the iframe integration lacks some kind of flexibility you can allways switch to a **Custom Integration**.

All the work you have done to make the iframe look like your website will stil work, since custom integration is doing the exact same thing like the iframe way - but you can customize much further. 

Custom integration comes with a **uiHelper.js** file which does all of the ui-work you already familiar with from the iframe-integration.

It uses teh Printess-JS-Api to communicate with tzhe editor.

**uiHelper.js** is also available as a typescript version and we provide you with a **printess-editor.d.ts** file for the Printess-JS API.



Printess can easily be loaded from our CDN.

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

The `attachPrintess` call initializes Printess, passes the authentication token and the name of the template to be loaded. See all parameters here: [JS-API](https://printess.com/js-api)

Please be aware that you'll need to tell Printess the path to its resource files (Web-Assembly and Default Fonts) in a separate property `resourcePath`. Please do not change this value.

The `domain` should remain unchanged. It only needs to be changed if you are uing a private Printess cloud.

In the `div` property you need to pass a div-element which Printess Editor will attach to.
Printess is intended to have as much space as possible, so it is highly recommended to not leave space on left and right side. Especially on mobile.

`token` should be set to a **Shop-Token** which points to yout Printess Account. You can get this token once you are logged in in the Printess Editor -> Account Menu -> API-Token. You'll see 3 different tokens in the dialog. Please always use the **Shop-Token**.

Finally the variable named `printess` contains a [JS-API](https://printess.com/js-api) reference to the Printess editor.


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

[Find more information here](https://printess.com/kb/user-manual/js-api.html)

[Full API-Documentation](https://printess.com/js-api/)

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

### Please find more documentation in the [Printess Knowledge Base](https://printess.com/kb/user-manual/js-api.html) 

