/* eslint-disable @typescript-eslint/ban-ts-comment */

import { iconName, iExternalError, iExternalListMeta, iExternalFieldListEntry, iExternalProperty, iExternalSnippetCluster, iExternalSpreadInfo, iPrintessApi, iMobileUIButton, iExternalMetaPropertyKind, MobileUiState, iMobileUiState, iExternalTableColumn } from "./printess-editor";

declare const bootstrap: any;

(<any>window).uiHelper = {
  renderLayoutSnippets: renderLayoutSnippets,
  getOverlay: getOverlay,
  renderMobileUi: renderMobileUi,
  renderMobileNavBar: renderMobileNavBar,
  renderDesktopUi: renderDesktopUi,
  refreshUndoRedoState: refreshUndoRedoState,
  viewPortScroll: viewPortScroll,
  viewPortResize: viewPortResize,
  viewPortScrollInIFrame: viewPortScrollInIFrame,
  resize: resize
}

let uih_viewportHeight: number = window.visualViewport ? window.visualViewport.height : window.innerHeight;
let uih_viewportWidth: number = window.visualViewport ? window.visualViewport.width : window.innerWidth;
let uih_viewportOffsetTop: number = 0;

let uih_currentGroupSnippets: Array<iExternalSnippetCluster> = [];
let uih_currentProperties: Array<iExternalProperty> = [];
let uih_currentState: MobileUiState = "document";
let uih_currentRender: "mobile" | "desktop" | "never" = "never";


let uih_lastPrintessHeight = 0;
let uih_lastPrintessWidth = 0;
let uih_lastPrintessTop = "";
let uih_lastPrintessBottom = 0;

let uih_lastOverflowState = false;

console.log("Printess ui-helper loaded");


async function addToBasket(printess: iPrintessApi) {
  const errors = printess.validate("all");
  if (errors.length > 0) {
    getValidationOverlay(printess, errors);
    return;
  }

  await printess.clearSelection();
  const callback = printess.getAddToBasketCallback();
  if (callback) {
    printess.showOverlay(printess.gl("ui.saveProgress"))
    const saveToken = await printess.save();
    const url = await printess.renderFirstPageImage("thumbnail.png");
    callback(saveToken, url);
    printess.hideOverlay();
  } else {
    alert(printess.gl("ui.addToBasketCallback"))
  }
}

function gotoNextStep(printess: iPrintessApi) {


  const errors = printess.validate(printess.hasNextStep() ? "until-current-step" : "all");
  if (errors.length > 0) {
    getValidationOverlay(printess, errors);
    return;
  }
  if (printess.hasNextStep()) {
    printess.nextStep();
  } else {
    addToBasket(printess);
  }
}


function viewPortScroll(printess: iPrintessApi) {
  // safari pushes viewport up to show keyboars, android doesn't
  if (printess) {
    _viewPortScroll(printess, "scroll");
  }
}
function viewPortResize(printess: iPrintessApi) {
  if (printess) {
    checkAndSwitchViews(printess);
    _viewPortScroll(printess, "resize");
  }
}

function resize(printess: iPrintessApi) {
  if (printess) {
    checkAndSwitchViews(printess);
    printess.resizePrintess(false, false, undefined);
  }
}

function checkAndSwitchViews(printess: iPrintessApi) {
  if (printess) {
    const mobile = printess.isMobile();
    if (mobile && uih_currentRender !== "mobile") {
      // switch to mobile
      renderMobileUi(printess);
      renderMobileNavBar(printess);
    }
    if (!mobile && uih_currentRender !== "desktop") {
      // switch to desktop
      renderDesktopUi(printess);
    }
  }
}

function _viewPortScroll(printess: iPrintessApi, _what: "scroll" | "resize") {
  //console.log("!!!! View-Port-" + what + "-Event: top=" + window.visualViewport.offsetTop, window.visualViewport);
  if (uih_viewportOffsetTop !== window.visualViewport.offsetTop || uih_viewportHeight !== window.visualViewport.height || uih_viewportWidth !== window.visualViewport.width) {
    uih_viewportOffsetTop = window.visualViewport.offsetTop;
    uih_viewportHeight = window.visualViewport.height;
    uih_viewportWidth = window.visualViewport.width;
    const printessDiv = document.getElementById("desktop-printess-container");
    if (printessDiv) {
      if (printess.isMobile()) {
        printessDiv.style.height = "";
        if (window.visualViewport.offsetTop > 0) {
          // system has auto scrolled content, so we adjust printess-editor to fit and auto focus selected element 
          resizeMobileUi(printess, true);
        } else {
          resizeMobileUi(printess, false);
        }
      } else {
        // safari can't determine grid row-height automatically (1fr);
        const desktopGrid: HTMLElement | null = document.getElementById("printess-desktop-grid");
        if (desktopGrid) {
          if (printess.autoScaleDetails().enabled) {
            printessDiv.style.height = printess.autoScaleDetails().height + "px";
            printessDiv.style.width = printess.autoScaleDetails().width + "px";
            printess.resizePrintess();
          } else {
            const height = desktopGrid.offsetHeight || window.innerHeight; // fallback when running inside printess-editor
            const calcHeight = "calc(" + height + "px - 50px - var(--editor-margin-top) - var(--editor-margin-bottom))";
            printessDiv.style.height = calcHeight;
            printess.resizePrintess(); //false, undefined, undefined, height);
          }
        }
      }
    }
  }
}

function viewPortScrollInIFrame(printess: iPrintessApi, vpHeight: number, vpOffsetTop: number) {
  //console.log("!!!! View-Port-Scroll in iFrame: offsetTop=" + vpOffsetTop + "   height=" + vpHeight);
  uih_viewportHeight = vpHeight;
  uih_viewportOffsetTop = vpOffsetTop;
  uih_viewportWidth = window.innerWidth;
  const printessDiv = document.getElementById("desktop-printess-container");
  if (printessDiv) {
    if (vpOffsetTop > 0) {
      // system has auto scrolled content, so we adjust printess-editor to fit and auto focus selected element 
      resizeMobileUi(printess, true);
    } else {
      resizeMobileUi(printess, false);
    }
  }
}


function renderDesktopUi(printess: iPrintessApi, properties: Array<iExternalProperty> = uih_currentProperties, state: MobileUiState = uih_currentState, groupSnippets: Array<iExternalSnippetCluster> = uih_currentGroupSnippets): Array<string> {

  if (uih_currentRender === "never") {
    // initialize grid-position
    if (window.visualViewport && !printess.autoScaleEnabled()) {
      uih_viewportHeight = -1; // force re-rendering the view
      _viewPortScroll(printess, "resize");
    } else {
      printess.resizePrintess();
    }
  } else if (uih_currentRender === "mobile" && printess.autoScaleDetails().enabled) {
    printess.resizePrintess();
  }



  uih_currentGroupSnippets = groupSnippets;
  uih_currentState = state;
  uih_currentProperties = properties;
  uih_currentRender = "desktop";

  // remove mobile ui if rendered before
  const mobileUi: HTMLDivElement | null = document.querySelector(".mobile-ui");
  if (mobileUi) {
    mobileUi.innerHTML = "";
  }


  const printessDiv = document.getElementById("desktop-printess-container");
  const container = document.getElementById("desktop-properties");
  if (!container || !printessDiv) {
    throw "#desktop-properties or #desktop-printess-container not found, please add to html.";
  }

  printessDiv.style.position = "relative"; // reset static from mobile, be part of parent layout again
  printessDiv.style.top = "";
  printessDiv.style.left = "";
  printessDiv.style.bottom = "";
  printessDiv.style.right = "";

  container.innerHTML = "";
  const t = [];

  const nav = getMobileNavbarDiv();
  if (nav) nav.parentElement?.removeChild(nav);

  const spreads = printess.getAllSpreads();
  const info = printess.pageInfoSync();
  renderPageNavigation(printess, spreads, info);

  if (printess.hasSteps()) {
    // if document has steps, display current step:
    container.appendChild(getDesktopStepsUi(printess));
  } else {
    // display template name
    container.appendChild(getDesktopTitle(printess))
  }

  if (state === "document") {
    //****** Show Document Wide Options
    for (const p of properties) {
      t.push(JSON.stringify(p, undefined, 2));
      container.appendChild(getPropertyControl(printess, p));
      validate(printess, p);
    }
    container.appendChild(renderGroupSnippets(printess, groupSnippets, false))
  } else {
    //****** Show Just the frame / text Properties
    let colorsContainer = null;
    for (const p of properties) {
      if (p.kind === "color") {
        if (!colorsContainer) {
          colorsContainer = document.createElement("div");
          colorsContainer.className = "color-drop-down-list";
          container.appendChild(colorsContainer);
        }
        colorsContainer.appendChild(getPropertyControl(printess, p))
      } else {
        colorsContainer = null;
        container.appendChild(getPropertyControl(printess, p));
        validate(printess, p);
      }
      t.push(JSON.stringify(p, undefined, 2));
    }
    const hr = document.createElement("hr");
    container.appendChild(hr);
    container.appendChild(getDoneButton(printess));
  }
  return t;
}

/*
 * Renders a control for a given property 
 */
function getPropertyControl(printess: iPrintessApi, p: iExternalProperty, metaProperty?: iExternalMetaPropertyKind, forMobile: boolean = false): HTMLElement {

  switch (p.kind) {

    case "background-button":
      return getChangeBackgroundButton(printess);

    case "single-line-text":
      return getSingleLineTextBox(printess, p, forMobile);

    case "text-area":
      return getTextArea(printess, p, forMobile);

    case "multi-line-text":
      if (forMobile) {
        switch (metaProperty) {
          case "text-style-color":
            return getColorDropDown(printess, p, "color");
          case "text-style-font":
            return getFontDropDown(printess, p, true)
          case "text-style-hAlign":
            return getHAlignControl(printess, p, true);
          case "text-style-size":
            return getFontSizeDropDown(printess, p, true);
          case "text-style-vAlign":
            return getVAlignControl(printess, p, true);
          case "text-style-vAlign-hAlign":
            return getVAlignAndHAlignControl(printess, p, true);
          default:
            return getMultiLineTextBox(printess, p, forMobile)
        }
      } else {
        return getMultiLineTextBox(printess, p, forMobile);
      }

    case "selection-text-style":
      return getTextStyleControl(printess, p);


    case "color":
      return getColorDropDown(printess, p, undefined, forMobile);
    // return getColorControl(printess, p);

    case "number":
      return getNumberSlider(printess, p);

    case "image":
      if (forMobile) {
        if (metaProperty) {
          switch (metaProperty) {
            case "image-sepia":
            case "image-brightness":
            case "image-contrast":
            case "image-hueRotate":
            case "image-vivid":
              return getNumberSlider(printess, p, metaProperty, true);
            case "image-scale":
              return getImageScaleControl(printess, p, true);
          }
          const d = document.createElement("div");
          d.innerText = printess.gl("ui.missingControl");
          return d;
        } else {
          return getImageUploadControl(printess, p, undefined, forMobile);
        }
      }
      return getTabPanel([
        { id: "upload-" + p.id, title: printess.gl("ui.imageTab"), content: getImageUploadControl(printess, p) },
        { id: "filter-" + p.id, title: printess.gl("ui.filterTab"), content: getImageFilterControl(printess, p) },
        { id: "rotate-" + p.id, title: printess.gl("ui.rotateTab"), content: getImageRotateControl(printess, p) }
      ]);


    case "select-list":
      return getDropDown(printess, p, forMobile);

    case "image-list":
      return getImageSelectList(printess, p, forMobile);

    case "table":
      return getTableControl(printess, p, forMobile);

  }


  const div = document.createElement("div");
  div.innerText = printess.gl("ui.missingProperty", p.kind);
  return div;

}

/*
 * All varoious controls rendering 
 */


function getChangeBackgroundButton(printess: iPrintessApi): HTMLElement {
  const ok = document.createElement("button");
  ok.className = "btn btn-secondary align-self-start";
  ok.innerText = printess.gl("ui.buttonChangeBackground");
  ok.onclick = () => {
    printess.selectBackground();
  }
  return ok;
}

function getDoneButton(printess: iPrintessApi): HTMLElement {
  const ok = document.createElement("button");
  ok.className = "btn btn-primary";
  if (printess.isCurrentStepActive()) {
    if (printess.hasNextStep()) {
      ok.innerText = printess.gl("ui.buttonNext");
    } else {
      ok.innerText = printess.gl("ui.buttonBasket");
    }
  } else {
    ok.innerText = printess.gl("ui.buttonDone");
  }
  ok.style.alignSelf = "start";
  ok.style.padding = "5px";
  ok.onclick = () => {
    if (printess.isCurrentStepActive()) {
      gotoNextStep(printess)
    } else {
      const errors = printess.validate("selection");
      if (errors.length > 0) {
        getValidationOverlay(printess, errors);
        return;
      }
      printess.clearSelection();
    }
  }
  return ok;
}

/*
function getColorControl(printess: iPrintessApi, p: iExternalProperty): HTMLElement {
  const cp = document.createElement("input");
  cp.type = "color";
  cp.value = p.value.toString();
  cp.onchange = () => {
    printess.setProperty(p.id, cp.value)
  }
  return cp;
}
*/

function getTextStyleControl(printess: iPrintessApi, p: iExternalProperty): HTMLElement {
  const textPropertiesDiv = document.createElement("div");
  textPropertiesDiv.classList.add("mb-3");

  if (!p.textStyle) {
    return textPropertiesDiv;
  }

  const group1 = document.createElement("div");

  group1.className = "input-group mb-3";
  const pre1 = document.createElement("div");
  pre1.className = "input-group-prepend";
  if (p.textStyle.allows.indexOf("color") >= 0) {
    getColorDropDown(printess, p, "color", false, pre1);
  }
  if (p.textStyle.allows.indexOf("size") >= 0) {
    getFontSizeDropDown(printess, p, false, pre1, false);
  }

  group1.appendChild(pre1);

  if (p.textStyle.allows.indexOf("font") >= 0) {
    getFontDropDown(printess, p, false, group1, false);
  }

  textPropertiesDiv.appendChild(group1);

  const group2 = document.createElement("div");
  group2.className = "input-group mb-3";
  group2.style.padding = "1px";
  group2.style.marginLeft = "0px";

  const pre2 = document.createElement("div");
  pre2.className = "input-group-prepend";

  if (p.textStyle.allows.indexOf("horizontalAlignment") >= 0) {
    group2.appendChild(getHAlignControl(printess, p, false));
  }

  const spacer = document.createElement("div");
  spacer.style.width = "10px";

  if (p.textStyle.allows.indexOf("horizontalAlignment") >= 0 && p.textStyle.allows.indexOf("verticalAlignment")) {
    group2.appendChild(spacer);
  }

  if (p.textStyle.allows.indexOf("verticalAlignment") >= 0) {
    group2.appendChild(getVAlignControl(printess, p, false));
  }
  textPropertiesDiv.appendChild(group2);

  return textPropertiesDiv;
}

function getMultiLineTextBox(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean): HTMLElement {
  const ta = getTextArea(printess, p, forMobile);
  if (forMobile) {
    return ta;
  } else {
    const container = document.createElement("div");
    container.appendChild(getTextStyleControl(printess, p));
    container.appendChild(ta);
    return container;
  }
}

function getSingleLineTextBox(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean): HTMLElement {

  const inp = document.createElement("input");
  inp.type = "text";
  inp.value = p.value.toString();
  inp.autocomplete = "off";
  inp.autocapitalize = "off";
  inp.spellcheck = false;

  // Key-up does not fire when autocomplete happens
  inp.oninput = () => {
    printess.setProperty(p.id, inp.value);
    p.value = inp.value;
    validate(printess, p);

    const mobileButtonDiv = document.getElementById(p.id + ":");
    if (mobileButtonDiv) {
      drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
    }
  }
  inp.onfocus = () => {
    if (inp.value && p.validation && p.validation.isMandatory && inp.value === p.validation.defaultValue) {
      inp.value = "";
    }
  }

  const r = addLabel(printess, inp, p, forMobile);
  return r;

  /* window.setTimeout(() => {
     inp.focus();
   }, 100)*/

}

function getDesktopTitle(printess: iPrintessApi): HTMLElement {
  const container = document.createElement("div");

  const hr = document.createElement("hr");
  container.appendChild(hr);

  const inner = document.createElement("div");
  inner.className = "desktop-title-bar mb-2"

  const h2 = document.createElement("h2");
  h2.innerText = printess.gl(printess.getTemplateTitle());
  inner.appendChild(h2);

  const basketBtn = document.createElement("button");
  basketBtn.className = "btn btn-primary";
  basketBtn.innerText = printess.gl("ui.buttonBasket");
  basketBtn.onclick = () => addToBasket(printess);
  inner.appendChild(basketBtn);


  container.appendChild(inner);
  container.appendChild(hr);
  return container;
}

// get validation modal that displays external property errors
function getValidationOverlay(printess: iPrintessApi, errors: Array<iExternalError>) {
  const modal = document.createElement("div");
  modal.className = "modal show align-items-center";
  modal.setAttribute("tabindex", "-1");
  modal.style.backgroundColor = "rgba(0,0,0,0.7)";
  modal.style.display = "flex";

  const dialog = document.createElement("div");
  dialog.className = "modal-dialog";
  dialog.style.minWidth = "500px";

  const content = document.createElement("div");
  content.className = "modal-content";

  const modalHeader = document.createElement("div");
  modalHeader.className = "modal-header bg-primary";

  const title = document.createElement("h3");
  title.className = "modal-title";
  title.innerHTML = printess.gl(`errors.${errors[0].errorCode}Title`).replace(/\n/g, "<br>")
  title.style.color = "#fff";

  const modalBody = document.createElement("div");
  modalBody.className = "modal-body";

  const footer = document.createElement("div");
  footer.className = "modal-footer";

  const ok = document.createElement("button");
  ok.className = "btn btn-primary";
  ok.textContent = printess.gl("ui.buttonOk");
  ok.onclick = () => {
    modal.style.display = "none";
  }

  const p = document.createElement("p");
  p.className = "error-message";
  p.textContent = `${printess.gl(`errors.${errors[0].errorCode}`, errors[0].errorValue1)}`;

  const errorLink = document.createElement("p");
  errorLink.className = "text-primary d-flex align-items-center";
  const numberOfErrors = errors.length - 1 > 1 ? "errors.moreProblems" : "errors.oneMoreProblem";
  errorLink.textContent = printess.gl(numberOfErrors, (errors.length - 1));
  errorLink.style.marginBottom = "0px";

  const svg = printess.getIcon("angle-down-light");
  svg.style.width = "15px";
  svg.style.marginLeft = "15px";
  svg.style.cursor = "pointer";
  errorLink.appendChild(svg);

  const errorList = document.createElement("ul");
  errorList.className = "list-group list-group-flush";
  for (let i = 1; i < errors.length; i++) {
    const item = document.createElement("li");
    const editBtn = printess.getIcon("edit");
    const errorText = "errors." + errors[i].errorCode + "Short";

    item.className = "list-group-item d-flex justify-content-between align-items-center";
    item.textContent = printess.gl(errorText, errors[i].errorValue1);

    editBtn.style.width = "20px";
    editBtn.style.marginLeft = "10px";
    editBtn.style.cursor = "pointer";
    editBtn.onclick = () => {
      printess.bringErrorIntoView(errors[i]);
      modal.style.display = "none";
    }

    item.appendChild(editBtn);
    errorList.appendChild(item);
  }

  modalHeader.appendChild(title);
  modalBody.appendChild(p);

  if (errors.length > 1) {
    let showErrorList = false;

    modalBody.appendChild(errorLink);

    svg.onclick = () => {
      showErrorList = !showErrorList;
      if (showErrorList) {
        modalBody.appendChild(errorList);
        svg.style.transform = "rotate(180deg)";
      } else if (!showErrorList && errorList) {
        modalBody.removeChild(errorList);
        svg.style.transform = "rotate(0deg)";
      }
    }
  }

  footer.appendChild(ok);
  content.appendChild(modalHeader);
  content.appendChild(modalBody);
  content.appendChild(footer);
  dialog.appendChild(content);
  modal.appendChild(dialog);
  document.body.appendChild(modal);
}

function getDesktopStepsUi(printess: iPrintessApi): HTMLElement {
  const container = document.createElement("div");

  const hr = document.createElement("hr");
  container.appendChild(hr);

  const flex = document.createElement("div");
  flex.className = "mb-2 d-flex align-items-center";

  if (printess.hasPreviousStep()) {
    const prevStep = document.createElement("button");
    prevStep.className = "btn";
    prevStep.style.paddingLeft = "0";
    const svg = printess.getIcon("arrow-left");
    svg.style.width = "20px";
    prevStep.appendChild(svg);
    prevStep.onclick = () => printess.previousStep();
    flex.appendChild(prevStep);
  }

  const cur = printess.getStep();
  if (cur && printess.isCurrentStepActive()) {
    const badge = document.createElement("div");
    badge.className = "step-badge";
    badge.innerText = (cur.index + 1).toString();
    flex.appendChild(badge);

    const h1 = document.createElement("h2");
    h1.style.flexGrow = "1";
    h1.className = "mb-0";
    h1.innerText = printess.gl(cur.title) || printess.gl("ui.step") + (cur.index + 1);
    flex.appendChild(h1);

  } else {
    // debugger;
    flex.style.justifyContent = "space-between";
  }

  if (printess.hasNextStep()) {
    const nextStep = document.createElement("button");
    nextStep.className = "btn btn-outline-primary";
    nextStep.innerText = printess.isNextStepPreview() ? printess.gl("ui.buttonPreview") : printess.gl("ui.buttonNext");
    nextStep.onclick = () => gotoNextStep(printess);
    flex.appendChild(nextStep);
  } else {
    // put to basket callback?
    const nextStep = document.createElement("button");
    nextStep.className = "btn btn-primary";
    nextStep.innerText = printess.gl("ui.buttonBasket");
    nextStep.onclick = () => addToBasket(printess);
    flex.appendChild(nextStep);
  }

  container.appendChild(flex);
  container.appendChild(hr);
  return container;
}


function getTextArea(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean): HTMLElement {

  const inp = document.createElement("textarea");
  inp.value = p.value.toString();
  inp.autocomplete = "off";
  inp.oninput = async () => {
    await printess.setProperty(p.id, inp.value);
    p.value = inp.value;
    validate(printess, p);
    const mobileButtonDiv = document.getElementById(p.id + ":");
    if (mobileButtonDiv) {
      drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
    }
  }
  inp.rows = 6;

  if (forMobile) {
    inp.className = "mobile-text-area";
    return addLabel(printess, inp, p, forMobile);
  } else {
    inp.className = "desktop-text-area";
    return addLabel(printess, inp, p, forMobile);
  }


}

function addLabel(printess: iPrintessApi, input: HTMLElement, p: iExternalProperty, forMobile: boolean, label?: string): HTMLElement {
  input.classList.add("form-control");

  const container = document.createElement("div");
  container.classList.add("mb-3");
  container.id = "cnt_" + p.id;

  if (p.label || label) {
    const htmlLabel = document.createElement("label");
    htmlLabel.className = "form-label";
    htmlLabel.setAttribute("for", "inp_" + p.id);
    htmlLabel.innerText = (label && (printess.gl(label)) || printess.gl(p.label) || "");
    htmlLabel.style.display = forMobile ? "none" : "inline-block";

    if (p.kind === "image") {
      const button = document.createElement("button");
      button.className = "btn btn-primary image-upload-btn";
      button.id = "upload-btn-" + p.id;
      htmlLabel.classList.add("image-upload-label");
      button.appendChild(htmlLabel);
      container.appendChild(button);
    } else {
      container.appendChild(htmlLabel);
    }
  }

  input.id = "inp_" + p.id;
  container.appendChild(input);

  const validation = document.createElement("div");
  validation.id = "val_" + p.id;
  validation.classList.add("invalid-feedback");
  validation.innerText = printess.gl("errors.textMissingInline");

  container.appendChild(validation);

  return container;
}

function validate(printess: iPrintessApi, p: iExternalProperty): void {
  if (p.validation) {
    const container = document.getElementById("cnt_" + p.id);
    const input = document.getElementById("inp_" + p.id);
    const validation = document.getElementById("val_" + p.id);

    if (container && input && validation) {

      if (p.validation.maxChars) {
        if (p.value.toString().length > p.validation.maxChars) {
          // container.classList.remove("was-validated");// add to activate BS-green-marker
          input.classList.add("is-invalid");
          validation.innerText = printess.gl("errors.maxCharsExceededInline", p.validation.maxChars);
          return;
        }
      }

      if (p.validation.isMandatory && (!p.value || p.value === p.validation.defaultValue)) {
        // container.classList.remove("was-validated"); // add to activate BS-green-marker
        input.classList.add("is-invalid");
        validation.innerText = p.kind === "image" ? printess.gl("errors.imageMissingInline") : printess.gl("errors.enterText");
        return
      }

      if (p.kind === "multi-line-text") {
        // check if an overflow occured
        // story text is changed via debounce method, so we need to wait a little before checking for overflow
        window.setTimeout(() => {
          uih_lastOverflowState = printess.hasTextOverflow(p.id);
          if (uih_lastOverflowState) {
            input.classList.add("is-invalid");
            validation.innerText = printess.gl("errors.textOverflowShort");
          } else {
            input.classList.remove("is-invalid");
          }
        }, 500);

        if (uih_lastOverflowState) {
          input.classList.add("is-invalid");
          validation.innerText = printess.gl("errors.textOverflowShort");
          return;
        } 
      }

      // container.classList.add("was-validated"); // add to activate BS-green-marker
      input.classList.remove("is-invalid");

    }
  }
}

function getImageSelectList(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean): HTMLElement {
  const container = document.createElement("div");
  if (p.listMeta && p.listMeta.list) {

    const cssId = p.id.replace("#", "-");

    if (p.listMeta.imageCss) {
      const st = document.createElement("style");
      const css = p.listMeta.imageCss.replace(/\.image/g, ".image" + cssId);
      st.innerHTML = css.split("\n").join("");
      container.appendChild(st);
    }

    const imageListWrapper = document.createElement("div");
    imageListWrapper.classList.add("image-select-list-wrapper");
    const imageList = document.createElement("div");
    imageList.classList.add("image-select-list");

    for (const entry of p.listMeta.list) {
      const thumb = document.createElement("div");
      thumb.className = "image" + cssId;
      thumb.style.backgroundImage = "url('" + entry.imageUrl + "')";
      thumb.style.width = p.listMeta.thumbWidth + "px";
      thumb.style.height = p.listMeta.thumbHeight + "px";
      if (entry.key === p.value) thumb.classList.add("selected");

      thumb.onclick = () => {
        printess.setProperty(p.id, entry.key);
        imageList.childNodes.forEach((c) => (<HTMLDivElement>c).classList.remove("selected"));
        thumb.classList.add("selected");
        p.value = entry.key;
        const mobileButtonDiv = document.getElementById(p.id + ":");
        if (mobileButtonDiv) {
          drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
        }

      }
      imageList.appendChild(thumb);
    }
    container.appendChild(imageList);
  }
  if (forMobile) {
    return container;
  } else {
    return addLabel(printess, container, p, forMobile);
  }


}



function getColorDropDown(printess: iPrintessApi, p: iExternalProperty, metaProperty?: "color", forMobile: boolean = false, dropdown?: HTMLDivElement): HTMLElement {

  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.classList.add("btn-group");
  }

  const colors = printess.getColors(p.id);

  const button = document.createElement("button");

  if (!forMobile) {

    button.className = "btn btn-light dropdown-toggle btn-color-select"; // color-picker-button";
    //  button.style.display = "flex";
    button.dataset.bsToggle = "dropdown";
    button.dataset.bsAutoClose = "true"
    button.setAttribute("aria-expanded", "false");
    if (metaProperty === "color" && p.textStyle) {
      button.style.backgroundColor = p.textStyle.color;
    } else {
      button.style.backgroundColor = p.value.toString();
    }
    // button.innerHTML = "&nbsp;";
    dropdown.appendChild(button);
  }

  const ddContent = document.createElement("div");
  ddContent.className = "dropdown-menu";
  ddContent.setAttribute("aria-labelledby", "defaultDropdown");
  ddContent.style.width = "240px";

  const colorList = document.createElement("div");
  colorList.className = "color-picker-drop-down";

  for (const f of colors) {
    const color = document.createElement("a");
    color.href = "#";
    color.className = "color-picker-color dropdown-item";
    color.style.backgroundColor = f.color;
    color.dataset.color = f.name;
    color.title = f.name;
    color.onclick = async () => {
      if (metaProperty === "color") {
        printess.setTextStyleProperty(p.id, metaProperty, f.name);
        const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty ?? ""));
        if (mobileButtonDiv && p.textStyle) {
          p.textStyle.color = f.color;
          drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
        }
      } else {
        await printess.setProperty(p.id, f.name);
        p.value = f.color;

        const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty ?? ""));
        if (mobileButtonDiv) {
          drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
        }
      }
      if (!forMobile) button.style.backgroundColor = f.color;
    }
    colorList.appendChild(color);
  }


  if (forMobile) {
    return colorList;
  } else {
    ddContent.appendChild(colorList);
    dropdown.appendChild(ddContent);
    return dropdown;
  }
}

function getDropDown(printess: iPrintessApi, p: iExternalProperty, asList: boolean, fullWidth: boolean = true): HTMLElement {

  const dropdown = document.createElement("div");
  dropdown.classList.add("btn-group");

  const ddContent = document.createElement("ul");

  if (p.listMeta && p.listMeta.list) {
    const selectedItem = p.listMeta.list.filter(itm => itm.key === p.value)[0] ?? null;
    const button = document.createElement("button");
    button.className = "btn btn-light dropdown-toggle";
    if (fullWidth) {
      button.classList.add("full-width");
    }
    // button.style.display = "flex";
    button.dataset.bsToggle = "dropdown";
    button.dataset.bsAutoClose = "true"
    button.setAttribute("aria-expanded", "false");
    if (selectedItem) {
      button.appendChild(getDropdownItemContent(printess, p.listMeta, selectedItem))
    }
    dropdown.appendChild(button);

    if (asList) {
      ddContent.classList.add("list-group");
    } else {
      ddContent.classList.add("dropdown-menu");
      ddContent.setAttribute("aria-labelledby", "defaultDropdown");
      ddContent.style.width = "100%";
    }
    for (const entry of p.listMeta.list) {
      const li = document.createElement("li");
      if (asList) {
        li.classList.add("list-group-item");
        if (entry === selectedItem) {
          li.classList.add("active");
        }
      }
      const a = document.createElement("a");
      a.href = "#";
      a.classList.add("dropdown-item");
      a.onclick = () => {
        printess.setProperty(p.id, entry.key);
        const mobileButtonDiv = document.getElementById(p.id + ":");
        if (mobileButtonDiv) {
          drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
        }
        if (p.listMeta) {
          button.innerHTML = "";
          button.appendChild(getDropdownItemContent(printess, p.listMeta, entry));
          if (asList) {
            ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
            li.classList.add("active")
          }
        }
      }
      a.appendChild(getDropdownItemContent(printess, p.listMeta, entry));
      li.appendChild(a);
      ddContent.appendChild(li)
    }
    dropdown.appendChild(ddContent);
  }
  if (asList) {
    return ddContent;
  } else {
    return addLabel(printess, dropdown, p, false);
  }
}

function getDropdownItemContent(printess: iPrintessApi, meta: iExternalListMeta, entry: iExternalFieldListEntry): HTMLElement {
  const div = document.createElement("div");
  div.classList.add("dropdown-list-entry");

  if (entry.imageUrl) {
    let tw = meta.thumbWidth;
    let th = meta.thumbHeight;
    const aspect = tw / th;
    if (th > 50) { // max for mobile
      th = 50;
      tw = th * aspect;
    }

    const img = document.createElement("div");
    img.classList.add("dropdown-list-image");
    img.style.backgroundImage = `url('${entry.imageUrl}')`;
    img.style.width = tw + "px";
    img.style.height = th + "px";
    img.style.marginRight = "10px";
    div.appendChild(img);
  }

  const label = document.createElement("div");
  label.classList.add("dropdown-list-label");
  label.innerText = printess.gl(entry.label);
  div.appendChild(label);

  return div;
}



function getTabPanel(tabs: Array<{ title: string, id: string, content: HTMLElement }>): HTMLDivElement {

  const panel = document.createElement("div");

  const ul = document.createElement("ul")
  ul.className = "nav nav-tabs";
  ul.setAttribute("role", "tablist");
  for (const t of tabs) {
    const li = document.createElement("li");
    li.className = "nav-item";
    const a = document.createElement("a");
    a.className = "nav-link";
    a.innerText = t.title;
    a.dataset.bsToggle = "tab";
    a.dataset.bsTarget = "#tab-" + t.id;
    if (t === tabs[0]) {
      a.classList.add("active")
    }
    li.appendChild(a);
    ul.appendChild(li);
  }

  const content = document.createElement("div");
  content.className = "tab-content card";
  content.style.borderTop = "none";
  for (const t of tabs) {
    const pane = document.createElement("div");
    pane.id = "tab-" + t.id;
    pane.className = "tab-pane card-body fade";

    pane.setAttribute("role", "tabpanel");
    if (t === tabs[0]) {
      pane.classList.add("show")
      pane.classList.add("active")
    }

    pane.appendChild(t.content);
    content.appendChild(pane);
  }

  panel.appendChild(ul);
  panel.appendChild(content);
  return panel;

}

function getImageFilterControl(printess: iPrintessApi, p: iExternalProperty): HTMLElement {
  const container = document.createElement("div");
  /*** Effects ***/
  p.imageMeta?.allows.forEach(metaProperty => {
    switch (metaProperty) {
      case "brightness": container.appendChild(getNumberSlider(printess, p, "image-brightness")); break;
      case "contrast": container.appendChild(getNumberSlider(printess, p, "image-contrast")); break;
      case "vivid": container.appendChild(getNumberSlider(printess, p, "image-vivid")); break;
      case "sepia": container.appendChild(getNumberSlider(printess, p, "image-sepia")); break;
      case "hueRotate": container.appendChild(getNumberSlider(printess, p, "image-hueRotate")); break;
    }
  })
  return container;
}

function getImageRotateControl(printess: iPrintessApi, p: iExternalProperty): HTMLElement {
  const container = document.createElement("div");

  if (p.imageMeta) {
    const imagePanel = document.createElement("div");
    imagePanel.className = "image-rotate-panel";

    for (let i = 1; i < 4; i++) {

      const thumbDiv = document.createElement("div");
      thumbDiv.className = "snippet-thumb";
      const thumb = document.createElement("img");
      thumb.src = p.imageMeta.thumbUrl;
      thumbDiv.appendChild(thumb);

      thumbDiv.onclick = () => {
        const rotAngle = (i * 90).toString();

        printess.rotateImage(p.id, <"90" | "180" | "270">rotAngle).finally(() => {
          imagePanel.innerHTML = "";
        })

        for (const c of [...imagePanel.childNodes]) {
          if (c !== thumbDiv) {
            (<HTMLDivElement>c).style.opacity = "0.4";
          } else {
            (<HTMLDivElement>c).style.border = "2px solid red";
          }
        }
      }

      thumbDiv.style.transformOrigin = "50% 50%";
      thumbDiv.style.transform = "rotate(" + i * 90 + "deg)"

      imagePanel.appendChild(thumbDiv);
    }

    container.appendChild(imagePanel);
  }

  return container;
}

function getImageUploadControl(printess: iPrintessApi, p: iExternalProperty, container?: HTMLDivElement, forMobile: boolean = false): HTMLElement {

  // for redraw after upoad, take passed container instead
  container = container || document.createElement("div");


  /***+ IMAGE UPLOAD ****/
  const fileUpload = document.createElement("div");
  fileUpload.className = "mb-3";
  fileUpload.id = "cnt_" + p.id;

  const progressDiv = document.createElement("div");
  progressDiv.className = "progress";
  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  progressBar.style.width = "0%";
  progressDiv.style.display = "none";
  progressDiv.appendChild(progressBar);


  const inp = document.createElement("input");
  inp.type = "file";
  inp.id = "inp_" + p.id;
  inp.className = "form-control"
  inp.accept = "image/png,image/jpg,image/jpeg"; // do not add pdf or svg, since it cannot be rotated!!
  inp.multiple = true;
  inp.style.display = "none";
  inp.onchange = () => {

    // printess.setProperty(p.id, inp.value);
    if (inp && inp.files?.length) {
      inp.disabled = true;
      inp.style.display = "none";
      if (scaleControl) scaleControl.style.display = "none";
      imagePanel.style.display = "none";
      progressDiv.style.display = "flex";

      const label = document.getElementById("upload-btn-" + p.id);
      if (label) {
        label.style.display = "none";
      }

      // can upload multiple files at once
      printess.uploadImages(inp.files, (progress) => {
        progressBar.style.width = (progress * 100) + "%"
      }
        , true, p.id); // true auto assigns image and triggers selection change which redraws this control.

      // optional: promise resolution returns list of added images 
      // if auto assign is "false" you must reset progress-bar width and control visibilty manually
      // .then(images => {console.log(images)};

    }
  };

  /* optinally add label before upload */
  const uploadLabel = document.createElement("label");
  uploadLabel.className = "form-label";
  uploadLabel.innerText = printess.gl("ui.uploadImageLabel");
  uploadLabel.setAttribute("for", "inp_" + p.id);
  // remove comments below to  add label
  // fileUpload.appendChild(uploadLabel);


  fileUpload.appendChild(addLabel(printess, inp, p, forMobile, "")); // to add error-message display 
  container.appendChild(progressDiv);
  container.appendChild(fileUpload);

  const imagePanel = document.createElement("div");
  imagePanel.className = "image-panel";

  const imageListWrapper = document.createElement("div");
  imageListWrapper.classList.add("image-list-wrapper");
  const imageList = document.createElement("div");
  imageList.classList.add("image-list");
  const images = printess.getImages(p.id);
  const mainThumb = document.createElement("div");
  if (p.imageMeta?.thumbCssUrl) {
    mainThumb.className = "main";
    mainThumb.style.backgroundImage = p.imageMeta.thumbCssUrl;
    imagePanel.appendChild(mainThumb);
  }
  for (const im of images) {
    const thumb = document.createElement("div");
    thumb.style.backgroundImage = im.thumbCssUrl;
    if (im.id === p.value) thumb.style.border = "2px solid red";
    thumb.onclick = () => {
      printess.setProperty(p.id, im.id);
      p.value = im.id,
        validate(printess, p);
    }
    imageList.appendChild(thumb);
  }
  imageListWrapper.appendChild(imageList);
  imagePanel.appendChild(imageListWrapper)



  /*** SCALE ***/
  let scaleControl: HTMLElement | undefined = undefined;
  if (forMobile) {
    container.classList.add("form-control");
    container.appendChild(imageList);
    return container;
  } else {
    container.appendChild(imagePanel);
    scaleControl = getImageScaleControl(printess, p);
    container.appendChild(scaleControl);
    return container;
  }

}


function getImageScaleControl(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean = false): HTMLElement {

  const rangeLabel = document.createElement("label");
  const range: HTMLInputElement = document.createElement("input");
  range.className = "form-range";

  range.type = "range";
  range.min = p.imageMeta?.scaleHints.min.toString() ?? "0";
  range.max = p.imageMeta?.scaleHints.max.toString() ?? "0";
  range.step = "0.01";
  range.value = p.imageMeta?.scale.toString() ?? "0";

  const span = document.createElement("span");
  if (p.imageMeta) {
    span.textContent = printess.gl("ui.imageScale", Math.floor(p.imageMeta.scaleHints.dpiAtScale1 / p.imageMeta.scale));
  }

  rangeLabel.appendChild(span);
  rangeLabel.appendChild(range);
  if (forMobile) {
    rangeLabel.classList.add("form-control")
  }

  range.oninput = () => {
    const newScale = parseFloat(range.value);
    printess.setImageMetaProperty(p.id, "scale", newScale);
    if (p.imageMeta) {
      p.imageMeta.scale = newScale;
      span.textContent = printess.gl("ui.imageScale", Math.floor(p.imageMeta.scaleHints.dpiAtScale1 / newScale));
      const mobileButtonDiv = document.getElementById(p.id + ":image-scale");
      if (mobileButtonDiv) {
        drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
      }

    }
  }

  return rangeLabel;
}

function getNumberSlider(printess: iPrintessApi, p: iExternalProperty, metaProperty: "image-hueRotate" | "image-brightness" | "image-contrast" | "image-vivid" | "image-sepia" | null = null, forMobile: boolean = false): HTMLElement {
  // creaate slider for all "Number" properties
  const ui = printess.getNumberUi(p, metaProperty);
  if (!ui) {
    const er = document.createElement("div");
    er.textContent = printess.gl("ui.numberSlider", p.id, (metaProperty || ""));
    return er;
  }

  const rangeLabel = document.createElement("label");
  const range: HTMLInputElement = document.createElement("input");
  range.className = "form-range";
  range.type = "range";
  range.min = ui.meta.min.toString();
  range.max = ui.meta.max.toString();
  range.step = ui.meta.step.toString();
  range.value = ui.value.toString();
  range.oninput = () => {

    const newValue = parseFloat(range.value);
    printess.setNumberUiProperty(p, metaProperty, newValue);

    if (metaProperty && p.imageMeta) {
      const imProp = <"hueRotate" | "brightness" | "contrast" | "vivid" | "sepia">metaProperty.replace("image-", "");
      p.imageMeta[imProp] = newValue; // update our model
    } else if (!metaProperty) {
      p.value = newValue; // update our model
    }
    // update mobile circle if present
    const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty ?? ""));
    if (mobileButtonDiv) {
      drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
    }
  }
  const span = document.createElement("span");
  span.textContent = metaProperty ? printess.gl('ui.' + metaProperty) : printess.gl(p.label);
  rangeLabel.appendChild(span);
  rangeLabel.appendChild(range);
  if (forMobile) {
    rangeLabel.classList.add("form-control")
  }
  return rangeLabel;
}


function getFontSizeDropDown(printess: iPrintessApi, p: iExternalProperty, asList: boolean, dropdown?: HTMLDivElement, fullWidth: boolean = true): HTMLElement {

  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.classList.add("btn-group");
    dropdown.classList.add("form-control");
  }
  dropdown.style.padding = "0";

  const sizes = ["6pt", "7pt", "8pt", "10pt", "12pt", "14pt", "16pt", "20pt", "24pt", "28pt", "32pt", "36pt", "42pt", "48pt", "54pt", "60pt", "66pt", "72pt", "78pt"];
  const ddContent = document.createElement("ul");
  if (p.textStyle && sizes.length) {
    const selectedItem = sizes.filter(itm => itm === p.textStyle?.size ?? "??pt")[0] ?? null;
    const button = document.createElement("button");
    button.className = "btn btn-light dropdown-toggle";
    if (fullWidth) {
      button.classList.add("full-width");
    }
    //  button.style.display = "flex";
    button.dataset.bsToggle = "dropdown";
    button.dataset.bsAutoClose = "true"
    button.setAttribute("aria-expanded", "false");
    if (selectedItem) {
      button.innerText = selectedItem;
    } else {
      button.innerText = p.textStyle?.size ?? "??pt";
    }
    dropdown.appendChild(button);

    if (asList) {
      ddContent.classList.add("list-group");
      ddContent.classList.add("list-group-grid-style");
    } else {
      ddContent.classList.add("dropdown-menu");
      ddContent.setAttribute("aria-labelledby", "defaultDropdown");
      ddContent.style.width = "100%";
      ddContent.style.maxHeight = "400px";
    }

    ddContent.style.overflow = "hidden auto";

    for (const entry of sizes) {
      const li = document.createElement("li");
      if (asList) {
        li.classList.add("list-group-item");
        if (entry === selectedItem) {
          li.classList.add("active");
        }
      }
      //const a = document.createElement("a");
      // a.href = "#";
      li.classList.add("dropdown-item");
      li.onclick = () => {
        button.innerHTML = "";
        printess.setTextStyleProperty(p.id, "size", entry);
        if (p.textStyle) p.textStyle.size = entry;
        button.innerText = entry;
        if (asList) {
          ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
          li.classList.add("active")
          // update button 
          const mobileButtonDiv = document.getElementById(p.id + ":text-style-size");
          if (mobileButtonDiv) {
            drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
          }
        }

      }

      li.innerText = entry;
      //   li.appendChild(a);
      ddContent.appendChild(li)
    }
    dropdown.appendChild(ddContent);
  }
  if (asList) {
    return ddContent;
  } else {
    return dropdown
  }


}

function getFontDropDown(printess: iPrintessApi, p: iExternalProperty, asList: boolean, dropdown?: HTMLDivElement, fullWidth: boolean = true): HTMLElement {

  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.classList.add("btn-group");
    dropdown.classList.add("form-control");
  }
  dropdown.style.padding = "0";

  const fonts = printess.getFonts(p.id);
  const ddContent = document.createElement("ul");

  if (p.textStyle && fonts.length) {
    const selectedItem = fonts.filter(itm => itm.name === p.textStyle?.font ?? "")[0] ?? null;
    const button = document.createElement("button");
    button.className = "btn btn-light dropdown-toggle";
    if (fullWidth) {
      button.classList.add("full-width");
    }
    // button.style.display = "flex";
    button.dataset.bsToggle = "dropdown";
    button.dataset.bsAutoClose = "true"
    button.setAttribute("aria-expanded", "false");
    if (selectedItem) {
      button.appendChild(getDropdownImageContent(selectedItem.thumbUrl));
    }
    dropdown.appendChild(button);

    if (asList) {
      ddContent.classList.add("list-group");
    } else {
      ddContent.classList.add("dropdown-menu");
      ddContent.setAttribute("aria-labelledby", "defaultDropdown");
      ddContent.style.width = "100%";
      ddContent.style.maxHeight = "400px";
    }


    ddContent.style.overflow = "hidden auto";

    for (const entry of fonts) {
      const li = document.createElement("li");

      li.classList.add("dropdown-item");

      if (asList) {
        li.classList.add("list-group-item");
        if (entry === selectedItem) {
          li.classList.add("active");
        }
      }

      li.onclick = () => {
        printess.setTextStyleProperty(p.id, "font", entry.name);
        if (p.textStyle) {
          p.textStyle.font = entry.name;
        }
        if (asList) {
          ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
          li.classList.add("active");
          // update button 
          const mobileButtonDiv = document.getElementById(p.id + ":text-style-font");
          if (mobileButtonDiv) {
            drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
          }
        } else {
          button.innerHTML = "";
          button.appendChild(getDropdownImageContent(entry.thumbUrl));
        }


      }
      li.appendChild(getDropdownImageContent(entry.thumbUrl));

      ddContent.appendChild(li)
    }
    dropdown.appendChild(ddContent);
  }
  if (asList) {
    return ddContent;
  } else {
    return dropdown
  }


}

function getDropdownImageContent(thumbUrl: string): HTMLDivElement {
  const img = document.createElement("img");
  img.src = thumbUrl;
  img.style.height = "20px";
  /* const div = document.createElement("div");
   div.style.width = "100%";
   div.style.display = "flex";
   div.appendChild(img);*/
  return img;
}


function getVAlignControl(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean) {

  const group = document.createElement("div");
  group.className = "btn-group";
  group.classList.add("align-control-item");

  if (!forMobile) {
    group.style.marginLeft = "0px";
  }

  if (forMobile) {
    group.classList.add("form-control");
    // group.style.left = "50%";
    // group.style.transform = "translateX(-50%)";
  }

  for (const v of ["top", "center", "bottom"]) {
    let icon: iconName = "align-top";
    switch (v) {
      case "center": icon = "align-middle"; break;
      case "bottom": icon = "align-bottom"; break;
    }

    const id = p.id + "btnVAlignRadio" + v;

    group.appendChild(getRadioButton(printess, p, id, "vAlign", v));
    group.appendChild(getRadioLabel(printess, p, id, "vAlign", icon));
  }

  return group;
}

function getHAlignControl(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean) {

  const group = document.createElement("div");
  group.className = "btn-group";
  group.classList.add("align-control-item");

  if (!forMobile) {
    group.style.marginLeft = "0px";
  }

  if (forMobile) {
    group.classList.add("form-control");
    // group.style.left = "50%";
    // group.style.transform = "translateX(-50%)";
  }
  for (const v of ["left", "right", "center", "justifyLeft"]) { // you can missing options if needed:  "justifyCenter", "justifyRight", "justifyJustify" 
    let icon: iconName = "text-align-left";
    switch (v) {
      case "right": icon = "text-align-right"; break;
      case "center": icon = "text-align-center"; break;
      case "justifyLeft": icon = "text-align-justify-left"; break;
      case "justifyCenter": icon = "text-align-justify-center"; break;
      case "justifyRight": icon = "text-align-justify-right"; break;
      case "justifyJustify": icon = "text-align-justify-justify"; break;
    }

    //  <input type="radio" class="btn-check" name="btnradio" id="btnradio1" autocomplete="off" checked>
    //  <label class="btn btn-outline-primary" for="btnradio1">Radio 1</label>

    const id = p.id + "btnHAlignRadio" + v;

    group.appendChild(getRadioButton(printess, p, id, "hAlign", v));
    group.appendChild(getRadioLabel(printess, p, id, "hAlign", icon));

  }

  return group;
}

function getVAlignAndHAlignControl(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean) {
  const container = document.createElement("div");
  container.className = "align-control-container";

  container.appendChild(getHAlignControl(printess, p, forMobile));
  container.appendChild(getVAlignControl(printess, p, forMobile));
  return container;
}

function getRadioLabel(printess: iPrintessApi, p: iExternalProperty, id: string, name: string, icon: iconName): HTMLLabelElement {
  const label = document.createElement("label");
  label.setAttribute("for", id);
  label.className = "btn btn-outline-dark";
  label.style.width = "46px";
  label.style.flex = "0 0 auto";
  const svg = printess.getIcon(icon);
  svg.style.width = "20px";
  svg.style.height = "20px";
  svg.style.pointerEvents = "none";
  label.appendChild(svg);
  return label;
}

function getRadioButton(printess: iPrintessApi, p: iExternalProperty, id: string, name: "hAlign" | "vAlign", value: string): HTMLInputElement {
  const radio = document.createElement("input");
  radio.type = "radio";
  radio.className = "btn-check";
  radio.dataset.value = value;
  radio.name = name + "_" + p.id;
  radio.id = id;
  if (p.textStyle && p.textStyle[name] === value) {
    radio.checked = true;
  }
  radio.onclick = () => {
    printess.setTextStyleProperty(p.id, name, value);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (p.textStyle) p.textStyle[name] = value;

    // update mobile button if exists:
    let mobileButtonDiv = document.getElementById(p.id + ":" + "text-style-" + name);
    if (!mobileButtonDiv && name === "hAlign") {
      mobileButtonDiv = document.getElementById(p.id + ":" + "text-style-vAlign-hAlign");
    }
    if (mobileButtonDiv) {
      drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
    }

  }
  return radio;
}





/*
 * PAGE LIST 
 */


function getPaginationItem(printess: iPrintessApi, content: number | "previous" | "next" | "ellipsis", spread?: iExternalSpreadInfo, page?: "left-page" | "right-page", isActive?: boolean): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "page-item";

  const a = document.createElement("div");
  a.className = "page-link";

  if (isActive) {
    li.classList.add("active");
  }

  if (typeof content === "number" && spread) {
    a.innerText = spread.name ? spread.name : content.toString();
  } else if (content === "previous") {
    const svg = printess.getIcon("carret-left-solid");
    svg.style.height = "1.3em";
    a.appendChild(svg);
    // a.innerHTML = "&laquo";
  } else if (content === "next") {
    const svg = printess.getIcon("carret-right-solid");
    svg.style.height = "1.3em";
    a.appendChild(svg);
    // a.innerHTML = "&raquo";
  } else if (content === "ellipsis") {
    a.innerHTML = "&#8230";
    a.className = "page-ellipsis disabled";
    li.style.opacity = "0.4";
  }
  li.appendChild(a);

  if (
    content === "ellipsis" || content === "previous" ||
    (spread &&
      ((page === "left-page" && spread.pages === 1) || (page === "right-page" && spread.pages === 2))
    )
  ) {
    li.classList.add("me-2");
  }
  li.onclick = () => {
    if (content === "previous") {
      printess.previousPage();
    } else if (content === "next") {
      printess.nextPage();
    } else if (spread) {
      printess.selectSpread(spread.index, page);
      document.querySelectorAll(".page-item").forEach(pi => pi.classList.remove("active"));
      li.classList.add("active");
    }

  }

  return li;
}

function refreshUndoRedoState(printess: iPrintessApi) {
  const btnUndo = <HTMLButtonElement>document.querySelector(".undo-button");
  if (btnUndo) {
    if (printess.undoCount() === 0) {
      btnUndo.disabled = true;
    } else {
      btnUndo.disabled = false;
    }
  }
  const btnRedo = <HTMLButtonElement>document.querySelector(".redo-button");
  if (btnRedo) {
    if (printess.redoCount() === 0) {
      btnRedo.disabled = true;
    } else {
      btnRedo.disabled = false;
    }
  }
}
function renderPageNavigation(printess: iPrintessApi, spreads: Array<iExternalSpreadInfo>, info?: { current: number, max: number, isFirst: boolean, isLast: boolean }, container?: HTMLDivElement, large: boolean = false, forMobile: boolean = false): void {

  // draw pages ui
  const pages = container || document.querySelector("#desktop-pagebar");
  if (pages) {
    let pageNo = 0;
    pages.innerHTML = "";

    if (!forMobile) {
      /* Add back/undo/redo mini desktop toolbar  */
      const miniBar = document.createElement("div");

      const btnBack = document.createElement("button");
      btnBack.className = "btn btn-sm";
      /*if (printess.hasPreviousStep()) {
        const icoBack = printess.getIcon("arrow-left");
        icoBack.classList.add("icon");
        btnBack.appendChild(icoBack);
      } else {*/
      btnBack.classList.add("btn-outline-secondary")
      btnBack.innerText = printess.gl("ui.buttonBack");
      //}

      btnBack.onclick = () => {
        const callback = printess.getBackButtonCallback();
        if (forMobile && printess.hasPreviousStep()) {
          printess.previousStep();
          renderMobileNavBar(printess);
        } else if (callback) {
          if (printess.isInDesignerMode()) {
            // do not save in designer mode.
            callback("");
          } else {
            printess.save().then((token) => {
              callback(token);
            });
          }
        } else {
          alert(printess.gl("ui.backButtonCallback"));
        }
      }

      miniBar.appendChild(btnBack);

      const btnUndo = document.createElement("button");
      btnUndo.className = "btn btn-sm undo-button";
      if (printess.undoCount() === 0) {
        btnUndo.disabled = true;
      }
      const icoUndo = printess.getIcon("undo");
      icoUndo.classList.add("icon");
      btnUndo.onclick = () => {
        printess.undo();
      }
      btnUndo.appendChild(icoUndo);
      miniBar.appendChild(btnUndo);

      const btnRedo = document.createElement("button");
      btnRedo.className = "btn btn-sm me-2 redo-button";
      const iconRedo = printess.getIcon("redo");
      iconRedo.classList.add("icon");
      if (printess.redoCount() === 0) {
        btnRedo.disabled = true;
      }
      btnRedo.onclick = () => {
        printess.redo();
      }
      btnRedo.appendChild(iconRedo);
      miniBar.appendChild(btnRedo);

      miniBar.className = "undo-redo-bar";
      pages.appendChild(miniBar);
    }

    const ul = document.createElement("ul");
    ul.className = "pagination justify-content-center";
    if (large) {
      ul.classList.add("pagination-lg");
    }

    if (spreads.length > 1) {


      const prev = getPaginationItem(printess, "previous");
      if (info && info.isFirst) {
        prev.classList.add("disabled");
      }
      ul.appendChild(prev);


      const count = spreads.reduce((prev, cur) => prev + cur.pages, 0);
      // const hasFacingPages = spreads.reduce((prev, cur) => prev || (cur.pages > 1 ? 1 : 0), 0);
      const current = info?.current || 1;
      let lastPos: "start" | "current" | "end" | "skip" = "start";
      for (const spread of spreads) {
        for (let pageIndex = 0; pageIndex < spread.pages; pageIndex++) {
          pageNo++;
          const page = pageIndex === 0 ? "left-page" : "right-page";
          const isActive = current === pageNo;

          let pos: "start" | "current" | "end" | "skip" = "skip";
          if (pageNo === 1) pos = "start";
          if (pageNo === count) pos = "end";
          if (current === 1) {
            // 1 23 45 67 89 N
            // * --          -
            if (pageNo === current + 1 || pageNo === current + 2) {
              pos = "current";
            }
          } else if (current === count) {
            // 1 23 45 67 89 N
            //            -- *  
            if (pageNo === current - 1 || pageNo === current - 2) {
              pos = "current";
            }
          } else if (current % 2 === 0) {
            // 1 23 45 67 89 N
            // - *-          -
            // even number, the next 4 
            if (pageNo === current || pageNo === current + 1) {
              pos = "current";
            }
          } else {
            // 1 23 45 67 89 N
            // -       -*    -
            // uneven 
            if (pageNo === current - 1 || pageNo === current) {
              pos = "current";
            }
          }

          if (pos === "skip") {
            if (lastPos !== "skip") {
              ul.appendChild(getPaginationItem(printess, "ellipsis"));
            }
          } else {
            ul.appendChild(getPaginationItem(printess, pageNo, spread, page, isActive));
          }

          lastPos = pos;
        }
      }

      const next = getPaginationItem(printess, "next");
      if (info && info.isLast) {
        next.classList.add("disabled");
      }
      ul.appendChild(next);
    }

    pages.appendChild(ul);
  }

}



/*
 * Snippets Lists
 */

function renderGroupSnippets(printess: iPrintessApi, groupSnippets: Array<iExternalSnippetCluster>, forMobile: boolean): HTMLElement {

  const div = document.createElement("div");
  div.className = "group-snippets";

  if (groupSnippets.length > 0) {
    // no selection, show add-able snippets instead
    for (const cluster of groupSnippets) {

      const headline = document.createElement("h5");
      headline.className = "snippet-cluster-name";
      headline.textContent = cluster.name;
      div.appendChild(headline)
      const hr = document.createElement("hr");
      hr.style.width = "100%";
      div.appendChild(hr);

      for (const snippet of cluster.snippets) {
        const thumbDiv = document.createElement("div");
        thumbDiv.className = "snippet-thumb";
        const thumb = document.createElement("img");
        thumb.src = snippet.thumbUrl;
        thumb.style.backgroundColor = snippet.bgColor;
        thumbDiv.appendChild(thumb);

        thumbDiv.onclick = () => {
          if (forMobile) {
            div.innerHTML === "";
          }
          printess.insertGroupSnippet(snippet.snippetUrl);
        }

        div.appendChild(thumbDiv);
      }
    }
  }
  if (forMobile) {
    const mobile = document.createElement("div");
    mobile.className = "mobile-group-snippets-container";
    div.style.marginTop = "-20px";
    mobile.appendChild(div);
    return mobile;
  } else {
    return div;
  }
}

function renderLayoutSnippets(printess: iPrintessApi, layoutSnippets: Array<iExternalSnippetCluster>): HTMLDivElement {

  const container = document.createElement("div");
  container.className = "layout-snippet-list";
  if (layoutSnippets) {
    for (const cluster of layoutSnippets) {
      const headline = document.createElement("div");
      headline.textContent = cluster.name;
      headline.className = "snippet-cluster-name";
      if (cluster === layoutSnippets[0]) {
        headline.style.marginTop = "0";
      }
      container.appendChild(headline)

      const clusterDiv = document.createElement("div");
      clusterDiv.className = "layout-snippet-cluster";
      for (const snippet of cluster.snippets) {
        const thumbDiv = document.createElement("div");
        thumbDiv.className = "snippet-thumb big";
        const thumb = document.createElement("img");
        thumb.src = snippet.thumbUrl;
        thumbDiv.appendChild(thumb);

        thumbDiv.onclick = () => {
          printess.insertLayoutSnippet(snippet.snippetUrl);
          // close off canvas via its button, the only way it propably worked ...
          const myOffcanvas = document.getElementById("closeLayoutOffCanvas");
          if (myOffcanvas) myOffcanvas.click();

          const offCanvas = document.getElementById("layoutOffcanvas");
          if (offCanvas) offCanvas.style.visibility = "hidden";
        }
        clusterDiv.appendChild(thumbDiv);
      }
      container.appendChild(clusterDiv);
    }
  }
  return container;
}

/*
 *   Table Controls
 */
let tableEditRow: Record<string, string | number | boolean> = {};
let tableEditRowIndex = -1;

function getTableControl(printess: iPrintessApi, p: iExternalProperty, _forMobile: boolean): HTMLElement {
  const container = document.createElement("div");
  let hasRow = false;
  if (p.tableMeta) {


    const data = JSON.parse(p.value.toString() || "[]");

    if (data.length > 0) {
      const table = document.createElement("table");
      table.className = "table mb-3";
      const thead = document.createElement("thead");
      let tr = document.createElement("tr");
      for (const col of p.tableMeta.columns) {
        if (p.tableMeta.tableType !== "calendar-events" || (col.name !== "month" && col.name !== "event")) {
          const th = document.createElement("th");
          th.scope = "col";
          th.innerText = col.label && printess.gl(col.label) || printess.gl(col.name);
          tr.appendChild(th);
        }
      }
      thead.appendChild(tr);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      let rowNumber = 0;
      for (const row of data) {
        if (p.tableMeta.tableType !== "calendar-events" || row.month == p.tableMeta.month) {
          tr = document.createElement("tr");
          tr.dataset.rowNumber = rowNumber.toString();
          for (const col of p.tableMeta.columns) {
            if (p.tableMeta.tableType !== "calendar-events" || (col.name !== "month" && col.name !== "event")) {
              const td = document.createElement("td");
              td.innerText = printess.gl(row[col.name].toString());
              tr.appendChild(td);
            }
          }
          tr.onclick = (ele: any) => {
            // tr.classList.add("table-active");
            const rowIndex = parseInt(ele.currentTarget.dataset.rowNumber);
            if (rowIndex >= 0) {
              for (const row of ele.currentTarget.parentElement.children) {
                row.classList.remove("table-active");
                ele.currentTarget.classList.add("table-active");
              }
            }
            tableEditRow = data[rowIndex];
            tableEditRowIndex = rowIndex;
            renderTableDetails(printess, p, false);

          };
          tbody.appendChild(tr);
          hasRow = true;
        }
        rowNumber++;
      }
      table.appendChild(tbody);
      if (hasRow) container.appendChild(table);
    }
    const addButton = document.createElement("button");
    addButton.className = "btn btn-primary mb-3";
    addButton.innerText = p.tableMeta.tableType === "calendar-events" ? printess.gl("ui.newEvent") : printess.gl("ui.newEntry");
    addButton.onclick = () => {
      if (p.tableMeta) {
        tableEditRowIndex = -1;
        tableEditRow = {};
        for (const col of p.tableMeta.columns) {
          tableEditRow[col.name] = col.list ? col.list[0] : col.data === "number" ? 0 : "";
        }
        if (p.tableMeta.tableType === "calendar-events") {
          tableEditRow.month = p.tableMeta.month || 1;
          tableEditRow.event = "Birthday";
        }
      }
      renderTableDetails(printess, p, false);
    }
    container.appendChild(addButton);
  }

  const details = document.createElement("div");
  details.id = "tableDetails_" + p.id;
  details.className = "container-fluid border"
  container.appendChild(details);

  return container;
}

function renderTableDetails(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean): HTMLElement {
  const details: HTMLElement | null = forMobile ? document.createElement("div") : document.getElementById("tableDetails_" + p.id);

  if (!details || !p.tableMeta) return document.createElement("div");


  details.innerHTML = "";

  if (p.tableMeta?.tableType === "calendar-events") {
    const group = document.createElement("div");
    group.className = "input-group mb-3";
    for (const col of p.tableMeta.columns) {
      if (col.name === "day") {
        const dayDiv = getTableTextBox(printess, p, tableEditRowIndex, tableEditRow, col, false);
        dayDiv.style.flexBasis = "80px"; //col.width ||
        dayDiv.style.marginRight = "10px"
        group.appendChild(dayDiv)
      } else if (col.name === "text") {
        const text = getTableTextBox(printess, p, tableEditRowIndex, tableEditRow, col, false);
        text.style.flexGrow = "1";
        text.style.flexBasis = "80px"
        text.style.marginRight = "10px"
        group.appendChild(text)
      }
    }
    details.appendChild(group);
  } else {
    for (const col of p.tableMeta.columns) {
      if (col.list?.length) {
        details.appendChild(getTableDetailsDropDown(printess, p, tableEditRowIndex, tableEditRow, col, false, true))
      } else {
        details.appendChild(getTableTextBox(printess, p, tableEditRowIndex, tableEditRow, col, false))
      }
    }
  }

  const submitButton = document.createElement("button");
  submitButton.className = "btn btn-primary mb-3 float-left";
  if (tableEditRowIndex === -1) {
    submitButton.innerText = printess.gl("ui.buttonAdd");
  } else {
    submitButton.innerText = printess.gl("ui.buttonSubmit");
  }
  submitButton.onclick = () => {
    if (p.tableMeta?.tableType === "calendar-events" && !tableEditRow.text) {
      alert(printess.gl("ui.eventText"));
      return
    }
    const data = JSON.parse(p.value.toString()) || [];
    if (tableEditRowIndex === -1) {
      data.push(tableEditRow);
    } else {
      data[tableEditRowIndex] = tableEditRow
    }
    p.value = JSON.stringify(data);
    printess.setProperty(p.id, p.value);
    details.innerHTML = "";
  }
  details.appendChild(submitButton);

  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-secondary mb-3 ml-3";
  cancelButton.style.marginLeft = "20px"; // ml-3 does not work ???
  cancelButton.innerText = printess.gl("ui.buttonCancel");
  cancelButton.onclick = () => {
    details.innerHTML = "";
    tableEditRowIndex = -1;
  }
  details.appendChild(cancelButton);

  if (tableEditRowIndex !== -1) {
    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-danger mb-3 ml-3";
    deleteButton.style.marginLeft = "20px"; // ml-3 does not work ???
    deleteButton.innerText = printess.gl("ui.buttonRemove");
    deleteButton.onclick = () => {
      const data: Array<any> = JSON.parse(p.value.toString()) || [];
      data.splice(tableEditRowIndex, 1);
      p.value = JSON.stringify(data);
      printess.setProperty(p.id, p.value);
      details.innerHTML = "";
    }
    details.appendChild(deleteButton);
  }
  return details;
}



function getTableDetailsShortList(printess: iPrintessApi, p: iExternalProperty, rowIndex: number, row: Record<string, any>, col: iExternalTableColumn): HTMLElement {
  const ddContent = document.createElement("div");
  ddContent.className = "dropdown-menu";
  ddContent.setAttribute("aria-labelledby", "defaultDropdown");
  ddContent.style.width = "240px";

  const list = document.createElement("div");
  list.className = "color-picker-drop-down";

  const value = row[col.name];
  for (const f of col.list || []) {
    const a = document.createElement("a");
    a.href = "#";
    a.className = "color-picker-color dropdown-item";
    a.innerText = f.toString();
    if (value == f) {
      a.classList.add("active");
    }
    a.onclick = () => {
      setTableValue(col, f)
      if (col.list) {
        list.querySelectorAll("a").forEach(a => a.classList.remove("active"));
        a.classList.add("active");
      }
    }
    list.appendChild(a);
  }
  return list;
}


function getTableDetailsDropDown(printess: iPrintessApi, p: iExternalProperty, rowIndex: number, row: Record<string, any>, col: iExternalTableColumn, asList: boolean, fullWidth: boolean = true): HTMLElement {

  const dropdown = document.createElement("div");
  dropdown.classList.add("btn-group");

  const ddContent = document.createElement("ul");

  const value = row[col.name];
  if (col.list) {
    const selectedItem = col.list.filter(s => s == value)[0] ?? null;
    const button = document.createElement("button");
    button.className = "btn btn-light dropdown-toggle";
    if (fullWidth) {
      button.classList.add("full-width");
    }
    // button.style.display = "flex";
    button.dataset.bsToggle = "dropdown";
    button.dataset.bsAutoClose = "true"
    button.setAttribute("aria-expanded", "false");
    if (selectedItem) {
      button.appendChild(getTableDropdownItemContent(printess, value))
    }
    dropdown.appendChild(button);

    if (asList) {
      ddContent.classList.add("list-group");
    } else {
      ddContent.classList.add("dropdown-menu");
      ddContent.setAttribute("aria-labelledby", "defaultDropdown");
      ddContent.style.width = "100%";
    }
    for (const entry of col.list) {
      const li = document.createElement("li");
      if (asList) {
        li.classList.add("list-group-item");
        if (entry === selectedItem) {
          li.classList.add("active");
        }
      }
      const a = document.createElement("a");
      a.href = "#";
      a.classList.add("dropdown-item");
      a.onclick = () => {
        setTableValue(col, entry);

        if (col.list) {
          button.innerHTML = "";
          button.appendChild(getTableDropdownItemContent(printess, entry));
          if (asList) {
            ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
            li.classList.add("active")
          }
        }
      }
      a.appendChild(getTableDropdownItemContent(printess, entry));
      li.appendChild(a);
      ddContent.appendChild(li)
    }
    dropdown.appendChild(ddContent);
  }
  if (asList) {
    return ddContent;
  } else {
    return addLabel(printess, dropdown, p, false, col.label || col.name);
  }
}
function getTableDropdownItemContent(printess: iPrintessApi, value: string | number): HTMLElement {
  const div = document.createElement("div");
  div.classList.add("dropdown-list-entry");

  const label = document.createElement("div");
  label.classList.add("dropdown-list-label");
  label.innerText = printess.gl(value.toString());
  div.appendChild(label);

  return div;
}
function getTableTextBox(printess: iPrintessApi, p: iExternalProperty, rowIndex: number, row: Record<string, any>, col: iExternalTableColumn, forMobile: boolean): HTMLElement {

  const inp = document.createElement("input");
  inp.type = "text";
  inp.value = row[col.name];
  inp.autocomplete = "off";
  inp.autocapitalize = "off";
  inp.spellcheck = false;

  // Key-up does not fire when autocomplete happens
  inp.oninput = () => {
    setTableValue(col, inp.value)
    //todo: add validation
  }

  if (forMobile) {
    inp.classList.add("form-control");
    return inp;
  } else {
    const r = addLabel(printess, inp, p, forMobile, col.label || col.name);
    return r;
  }
}

function setTableValue(col: iExternalTableColumn, newValue: string | number | boolean) {
  tableEditRow[col.name]
  if (col.data === "number" && typeof newValue !== "number") {
    tableEditRow[col.name] = isNaN(+newValue) ? 0 : +newValue;
  } else if (col.data === "boolean" && typeof newValue !== "boolean") {
    tableEditRow[col.name] = !!(newValue);
  } else {
    tableEditRow[col.name] = newValue;
  }
}






/*
 *   Mobile UI Buttons
 */
function getMobileUiDiv(): HTMLDivElement {
  let mobileUi: HTMLDivElement | null = document.querySelector(".mobile-ui");
  if (!mobileUi) {
    mobileUi = document.createElement("div");
    mobileUi.className = "mobile-ui";
    document.body.appendChild(mobileUi);
  }
  return mobileUi;
}
function getMobileNavbarDiv(): HTMLElement {
  let mobileNav: HTMLElement | null = document.querySelector(".mobile-navbar");
  if (!mobileNav) {
    mobileNav = document.createElement("nav");
    mobileNav.className = "mobile-navbar navbar navbar-dark bg-primary"
    document.body.appendChild(mobileNav);
  }
  return mobileNav;
}



function renderMobileUi(printess: iPrintessApi,
  properties: Array<iExternalProperty> = uih_currentProperties,
  state: MobileUiState = uih_currentState,
  groupSnippets: Array<iExternalSnippetCluster> = uih_currentGroupSnippets) {


  uih_currentGroupSnippets = groupSnippets;
  uih_currentState = state;
  uih_currentProperties = properties;
  uih_currentRender = "mobile";

  const mobileUi = getMobileUiDiv();
  mobileUi.innerHTML = "";

  // remove desktop ui if rendered before
  const desktopProperties = document.getElementById("desktop-properties");
  if (desktopProperties) {
    desktopProperties.innerHTML = "";
  }

  // render mobile page navigation if document has properties 
  if (state === "document") {
    if (properties.length === 0 || printess.spreadCount() < 2) {
      // sets css varibale --mobile-pagebar-height: 0px;
      document.body.classList.add("inline-mobile-page-bar");
    } else {
      document.body.classList.remove("inline-mobile-page-bar");
    }
  }

  if (state !== "add") {
    // render properties UI
    const buttonsOrPages = getMobileButtons(printess);
    mobileUi.innerHTML = "";
    mobileUi.appendChild(buttonsOrPages);
  }

  const controlHost = document.createElement("div");
  controlHost.className = "mobile-control-host";
  controlHost.id = "mobile-control-host";
  mobileUi.appendChild(controlHost);

  if (state === "add") {
    // render list of group snippets
    document.body.classList.add("no-mobile-button-bar");
    renderMobileControlHost(printess, { state: "add" })
  }

  // Buttons for "add" and "back ""
  if (groupSnippets.length > 0 && state !== "add") {
    mobileUi.appendChild(getMobilePlusButton(printess))
  }
  if (state !== "document") {
    mobileUi.appendChild(getMobileBackButton(printess, state))

  } else {
    // propably we where in text edit and now need to wait for viewport scroll evevnt to fire 
    // to not resize twice 
    // if (window.visualViewport && window.visualViewport.offsetTop) {
    if (uih_viewportOffsetTop) {
      return;
    }

  }

  resizeMobileUi(printess, false);

}

function getMobilePlusButton(printess: iPrintessApi): HTMLDivElement {
  const button = document.createElement("div");
  button.className = "mobile-property-plus-button";

  const circle = document.createElement("div");
  circle.className = "mobile-property-circle";
  circle.onclick = () => {
    renderMobileUi(printess, undefined, "add", undefined)
  }

  const icon = printess.getIcon("plus");
  circle.appendChild(icon);

  button.appendChild(circle);
  return button;
}

function getMobileBackButton(printess: iPrintessApi, state: MobileUiState): HTMLDivElement {
  const button = document.createElement("div");
  button.className = "mobile-property-back-button";

  const circle = document.createElement("div");
  circle.className = "mobile-property-circle";
  if (state === "details") {
    circle.classList.add("back-to-frames");
  }
  circle.onclick = () => {
    if (state === "details") {
      renderMobileUi(printess, undefined, "frames")
    } else if (state === "frames") {
      printess.clearSelection();
    } else if (state === "add" || state === "document") {
      renderMobileUi(printess, undefined, "document")
    }
  }

  const icon = printess.getIcon("arrow-left");
  circle.appendChild(icon);

  button.appendChild(circle);
  return button;
}

function renderMobileNavBar(printess: iPrintessApi) {

  const buttons = <const>["back", "undo", "redo", "step", "next"];



  //  const p = document.getElementById("desktop-printess-container");
  // console.warn("Resize Printess Height: " + p?.offsetHeight)
  // printess.resizePrintess(true, false, undefined, p?.offsetHeight ?? undefined);


  const nav = getMobileNavbarDiv();
  nav.innerHTML = "";
  for (const b of buttons) {

    const btn = document.createElement("button");
    btn.classList.add("btn");
    btn.classList.add("btn-sm");
    // btn.classList.add("btn-outline");
    btn.classList.add("me-2");

    switch (b) {
      case "back":

        btn.classList.add("ms-2");
        if (printess.hasPreviousStep()) {
          const ico = printess.getIcon("arrow-left");
          ico.classList.add("icon");
          btn.appendChild(ico);
        } else {
          btn.classList.add("btn-outline-light");
          btn.innerText = printess.gl("ui.buttonBack");
        }
        btn.onclick = () => {
          const callback = printess.getBackButtonCallback();
          if (printess.hasPreviousStep()) {
            printess.previousStep();
            renderMobileNavBar(printess);
          } else if (callback) {
            if (printess.isInDesignerMode()) {
              // do not save in designer mode.
              callback("");
            } else {
              printess.save().then((token) => {
                callback(token);
              })
            }
          } else {
            // show sample load ui

            const offcanvas = document.getElementById("templateOffcanvas");

            const bsOffcanvas = new bootstrap.Offcanvas(offcanvas);

            bsOffcanvas.show()

          }
        }
        nav.appendChild(btn);
        break;

      case "next":
        btn.classList.add("btn-outline-light");
        if (printess.hasNextStep()) {
          btn.innerText = printess.isNextStepPreview() ? printess.gl("ui.buttonPreview") : printess.gl("ui.buttonNext");
          const curStep = printess.getStep();
          const lastStep = printess.lastStep();
          if (curStep && lastStep) {
            btn.title = "Step " + curStep.index + " of " + lastStep.index;
          }
          btn.onclick = () => {
            gotoNextStep(printess);
            renderMobileNavBar(printess);
          }
        } else {
          btn.innerText = printess.gl("ui.buttonBasket");
          btn.onclick = () => addToBasket(printess);
        }



        nav.appendChild(btn);
        break;

      case "step": {
        const step = document.createElement("div");
        step.style.flexGrow = "1";
        step.style.display = "flex";
        step.style.alignItems = "center";
        step.style.justifyContent = "center";
        const s = printess.getStep();
        if (s && printess.isCurrentStepActive()) {
          const badge = document.createElement("div");
          badge.className = "step-badge step-badge-sm";
          badge.innerText = (s.index + 1).toString();

          step.appendChild(badge);
          const h6 = document.createElement("h6");
          h6.innerText = printess.gl(s.title);
          h6.style.margin = "0";
          h6.className = "text-light";
          step.appendChild(h6)
        }
        nav.appendChild(step);
        break;
      }

      case "undo": {
        const ico = printess.getIcon("undo");
        ico.classList.add("icon");
        btn.onclick = () => {
          printess.undo();
        }
        btn.appendChild(ico);
        nav.appendChild(btn);
        break;
      }

      case "redo": {
        btn.classList.remove("me-2");
        const ico = printess.getIcon("redo");
        ico.classList.add("icon");
        btn.onclick = () => {
          printess.redo();
        }
        btn.appendChild(ico);
        nav.appendChild(btn);
        break;
      }
    }
  }
  return nav;
}



function getMobilePageBarDiv(): HTMLDivElement {
  let pagebar: HTMLDivElement | null = document.querySelector(".mobile-pagebar");
  if (!pagebar) {
    pagebar = document.createElement("div");
    pagebar.className = "mobile-pagebar";
    document.body.appendChild(pagebar);
  } else {
    pagebar.innerHTML = "";
  }
  return pagebar;
}

/*
function getMobileSelectedProperty(properties: Array<iExternalProperty>): iExternalProperty | null {
  const selectedButton = document.querySelector(".mobile-property-button.selected");
  if (selectedButton) {
    const id = selectedButton.id.split(":")[0];
    const property = properties.filter(p => p.id === id)[0];
    if (property) {
      return property;
    }
  }
  return null;
}
*/



function resizeMobileUi(printess: iPrintessApi, focusSelection: boolean = false) {
  const mobileUi = getMobileUiDiv();
  // const mobilePagebarDiv = getMobilePageBarDiv();
  const controlHost: HTMLElement | null = document.getElementById("mobile-control-host");
  // determine used-height of current controls
  if (mobileUi && controlHost) {

    const controlHostHeight = controlHost.offsetHeight;
    // read button bar height from CSS Variable.
    const mobileNavBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-navbar-height").trim().replace("px", "") || "");
    const mobilePageBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-pagebar-height").trim().replace("px", "") || "");
    const mobileButtonBarHeight = parseInt(getComputedStyle(document.body).getPropertyValue("--mobile-buttonbar-height").trim().replace("px", "") || "");

    /* if (mobileButtonBarHeight === 0 && mobilePagebarDiv) {
       mobilePagebarDiv.style.display = "none";
     } else {
       mobilePagebarDiv.style.display = "block";
     }*/

    mobileUi.style.height = (mobileButtonBarHeight + controlHostHeight + 2) + "px"; // +2 = border-top
    const printessDiv = document.getElementById("desktop-printess-container");
    const viewPortHeight = uih_viewportHeight || window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const viewPortWidth = uih_viewportWidth || window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const viewPortTopOffset = uih_viewportOffsetTop; //  ?? window.visualViewport ? window.visualViewport.offsetTop : 0;

    let printessHeight = viewPortHeight - controlHostHeight - mobileButtonBarHeight;
    if (printessDiv) {
      let printessTop: string;

      // make sure printessDiv position is absolute relative


      if (viewPortTopOffset > 0) {
        // counter-act view-port shift if iOS keyboard is visible
        printessTop = viewPortTopOffset + "px";

      } else if (controlHostHeight > 100 || viewPortTopOffset > 0) {
        // hide toolbar & pagebar to free up more space 
        printessTop = "0";
        window.setTimeout(() => {
          const toolBar: HTMLDivElement | null = document.querySelector(".mobile-navbar");
          if (toolBar) toolBar.style.visibility = "hidden";
          const pageBar: HTMLDivElement | null = document.querySelector(".mobile-pagebar");
          if (pageBar) pageBar.style.visibility = "hidden";
        }, 400);

      } else {
        // reduce height by visible toolbar and pagebar 
        let top = 0;
        printessTop = "";
        printessHeight -= mobilePageBarHeight;
        printessHeight -= mobileNavBarHeight;
        const toolBar: HTMLDivElement | null = document.querySelector(".mobile-navbar");
        if (toolBar) {
          toolBar.style.visibility = "visible";
          top += mobileNavBarHeight;
        }
        const pageBar: HTMLDivElement | null = document.querySelector(".mobile-pagebar");
        if (pageBar) {
          pageBar.style.visibility = "visible";
          top += mobilePageBarHeight;
        }
        printessTop = top + "px";
      }

      const printessBottom = mobileButtonBarHeight + controlHostHeight;

      if (printessBottom !== uih_lastPrintessBottom || printessTop !== uih_lastPrintessTop || printessHeight !== uih_lastPrintessHeight || viewPortWidth !== uih_lastPrintessWidth) {
        uih_lastPrintessBottom = printessBottom;
        uih_lastPrintessTop = printessTop;
        uih_lastPrintessHeight = printessHeight;
        uih_lastPrintessWidth = viewPortWidth;

        printessDiv.style.position = "fixed"; // to counter act relative positions above and width/height settings
        printessDiv.style.left = "0";
        printessDiv.style.right = "0";

        printessDiv.style.bottom = (mobileButtonBarHeight + controlHostHeight) + "px";
        printessDiv.style.top = printessTop;

        printessDiv.style.width = "";
        printessDiv.style.height = "";

        printess.resizePrintess(true, focusSelection, undefined, printessHeight);
        // console.warn("resizePrintess height:" + printessHeight, window.visualViewport);
      }
    }
  }

}

function getMobileButtons(printess: iPrintessApi, container?: HTMLDivElement, propertyIdFilter?: string): HTMLDivElement {
  container = container || document.createElement("div");
  container.className = "mobile-buttons-container";

  const scrollContainer = document.createElement("div");
  scrollContainer.className = "mobile-buttons-scroll-container";
  //  window.setTimeout(() => { scrollContainer.scrollLeft = 120 }, 100);

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "mobile-buttons";


  const buttons = printess.getMobileUiButtons(uih_currentProperties, propertyIdFilter || "root");

  const hasButtons = buttons.length > 0;

  if (printess.spreadCount() > 1) {
    const spreads = printess.getAllSpreads();
    const info = printess.pageInfoSync();
    if (hasButtons && !document.body.classList.contains('inline-mobile-page-bar')) {
      renderPageNavigation(printess, spreads, info, getMobilePageBarDiv(), false, true);
    } else if (!hasButtons) {
      // if we have no properties on document level, we can render an even larger page navigation in the button bar 
      document.body.classList.remove("no-mobile-button-bar");

      buttonContainer.style.width = "100%" // centers the page navigation

      renderPageNavigation(printess, spreads, info, buttonContainer, true, true);

    }
  }

  let autoSelect = false;
  if (buttons.length === 1) {
    const ep = buttons[0].newState.externalProperty;
    if (ep && ep.id.startsWith("FF_")) {
      // only auto show simple text-form fields not complex once - creates bad user experience
      if (ep.kind === 'single-line-text') {
        autoSelect = true;
      }
    } else {
      autoSelect = false;
    }
  }

  if (autoSelect) {
    // Auto jump to first button action: 
    document.body.classList.add("no-mobile-button-bar");

    window.setTimeout(() => {
      const b = buttons[0];
      if (b.newState.externalProperty?.kind === "background-button") {
        // jump directly to background frames 
        printess.selectBackground();
      } else {
        renderMobileControlHost(printess, b.newState);
      }

    }, 50);

  } else if (hasButtons) {
    document.body.classList.remove("no-mobile-button-bar");

    // if the selection contains multiple frames it might be better to show a 2 level ui, first the main features and then the meta-properties 

    for (const b of buttons) {
      const buttonDiv = document.createElement("div");
      if (b.newState.tableRowIndex !== undefined) {
        buttonDiv.id = (b.newState.externalProperty?.id ?? "") + "$$$" + b.newState.tableRowIndex;
      } else {
        buttonDiv.id = (b.newState.externalProperty?.id ?? "") + ":" + (b.newState.metaProperty ?? "");
      }

      buttonDiv.className = printess.isTextButton(b) ? "mobile-property-text" : "mobile-property-button";

      buttonDiv.onclick = (_e: MouseEvent) => {

        if (b.newState.externalProperty?.kind === "background-button") {
          printess.selectBackground();

        } else if (b.newState.state === "table-add") {
          const p = b.newState.externalProperty;
          if (p?.tableMeta) {
            tableEditRowIndex = -1;
            tableEditRow = {};
            for (const col of p.tableMeta.columns) {
              tableEditRow[col.name] = col.list ? col.list[0] : col.data === "number" ? 0 : "";
            }
            if (p.tableMeta.tableType === "calendar-events") {
              tableEditRow.month = p.tableMeta.month || 1;
              tableEditRow.event = "Birthday";
            }
            renderMobileControlHost(printess, b.newState);
            getMobileUiDiv().appendChild(getMobileBackButton(printess, "document")); // group-snippets are only used with  "add" state

          }
        } else if (b.newState.state === "table-edit") {
          const p = b.newState.externalProperty;
          const rowIndex = b.newState.tableRowIndex ?? -1;
          if (p?.tableMeta && (rowIndex ?? -1) >= 0) {
            try {
              const data: Array<Record<string, any>> = JSON.parse(p.value.toString());
              tableEditRow = data[rowIndex];
              tableEditRowIndex = rowIndex;
              renderMobileControlHost(printess, b.newState);
              getMobileUiDiv().appendChild(getMobileBackButton(printess, "document")); // group-snippets are only used with  "add" state
            } catch (error) {
              console.error("property table has no array data:" + p.id)
            }

          }

        } else if (b.hasCollapsedMetaProperties === true && b.newState.externalProperty) {
          // render detaile button bar with meta-properties for images and stories 
          const buttonContainer = document.querySelector(".mobile-buttons-container");
          if (buttonContainer) {
            buttonContainer.innerHTML = "";
            getMobileButtons(printess, container, b.newState.externalProperty.id);
            const backButton = document.querySelector(".mobile-property-back-button");
            if (backButton) {
              backButton.parentElement?.removeChild(backButton);
            }
            getMobileUiDiv().appendChild(getMobileBackButton(printess, "details")); // group-snippets are only used with  "add" state
          }
        } else {
          document.querySelectorAll(".mobile-property-button").forEach((ele) => ele.classList.remove("selected"));
          document.querySelectorAll(".mobile-property-text").forEach((ele) => ele.classList.remove("selected"));
          buttonDiv.classList.toggle("selected");
          buttonDiv.innerHTML = "";
          drawButtonContent(printess, buttonDiv, uih_currentProperties);
          centerMobileButton(buttonDiv);

          // if a form field on doc level was selectected, we might not have a back button, so add one just in case 
          const backButton = document.querySelector(".mobile-property-back-button");
          if (backButton) {
            backButton.parentElement?.removeChild(backButton);
          }
          if (printess.isCurrentStepActive()) {
            // happens with rich-text-color
            getMobileUiDiv().appendChild(getMobileBackButton(printess, "details"));
          } else {
            getMobileUiDiv().appendChild(getMobileBackButton(printess, uih_currentState));
          }

        }

        // render control 
        renderMobileControlHost(printess, b.newState);
      }

      drawButtonContent(printess, buttonDiv, uih_currentProperties);

      buttonContainer.appendChild(buttonDiv);

    }

  }


  scrollContainer.appendChild(buttonContainer);
  container.appendChild(scrollContainer);
  return container;
}

function renderMobileControlHost(printess: iPrintessApi, state: iMobileUiState) {
  const controlHost = document.getElementById("mobile-control-host");

  if (controlHost) {
    controlHost.classList.remove("mobile-control-sm");
    controlHost.classList.remove("mobile-control-md");
    controlHost.classList.remove("mobile-control-lg");
    controlHost.classList.remove("mobile-control-xl");
    controlHost.innerHTML = "";
    if (state.state === "add") {
      controlHost.classList.add("mobile-control-xl");
      const snippets = renderGroupSnippets(printess, uih_currentGroupSnippets || [], true);
      controlHost.appendChild(snippets);

    } else if (state.externalProperty) {
      controlHost.classList.add(getMobileControlHeightClass(state.externalProperty, state.metaProperty))
      let control: HTMLElement;
      if (state.state === "table-add" || state.state === "table-edit") {
        control = renderTableDetails(printess, state.externalProperty, true)
      } else {
        control = getPropertyControl(printess, state.externalProperty, state.metaProperty, true)
      }
      controlHost.appendChild(control);
      resizeMobileUi(printess, true);
      validate(printess, state.externalProperty)
    }
  }
}

function getMobileControlHeightClass(property: iExternalProperty, meta?: iExternalMetaPropertyKind): string {
  switch (property.kind) {
    case "image":
      if (!meta) {
        return "mobile-control-lg"
      }
      break;
    case "multi-line-text":
      if (!meta || meta === "text-style-color" || meta === "text-style-font" || meta === "text-style-size") {
        return "mobile-control-lg"
      }
      break;
    case "color":
    case "text-area":
    case "select-list":
    case "image-list":
      return "mobile-control-lg"
    case "table":
      return "mobile-control-xl"
  }

  return "mobile-control-sm"
}


function drawButtonContent(printess: iPrintessApi, buttonDiv: HTMLDivElement, properties: Array<iExternalProperty>) {

  // find property by button id.
  const id = buttonDiv.id.split(":")
  let propertyId = id[0];
  let rowIndex: number | undefined = undefined;
  if (propertyId.startsWith("FF") && propertyId.indexOf("$$$") > 0) {
    const tId = propertyId.split("$$$");
    propertyId = tId[0];
    rowIndex = isNaN(+tId[1]) ? undefined : +tId[1];
  }
  const metaProperty = id[1] ?? ""
  const property = properties.filter(p => p.id === propertyId)[0];
  if (!property) return

  const buttons = printess.getMobileUiButtons([property], propertyId);
  let b: iMobileUIButton | undefined = undefined;
  if (rowIndex !== undefined) {
    for (const button of buttons) {
      if (button.newState.tableRowIndex === rowIndex) {
        b = button;
        break;
      }
    }
  } else {
    for (const button of buttons) {
      if ((button.newState.metaProperty ?? "") === metaProperty) {
        b = button;
        break;
      }
    }
  }
  if (!b) return;


  const isSelected = buttonDiv.classList.contains("selected");
  buttonDiv.innerHTML = "";

  if (printess.isTextButton(b)) {

    const buttonText = document.createElement("div");
    buttonText.className = "text";
    buttonText.innerText = b.caption;

    const buttonIcon = document.createElement("div");
    buttonIcon.className = "icon";
    buttonIcon.innerText = "T";

    buttonDiv.appendChild(buttonText);
    buttonDiv.appendChild(buttonIcon);


  } else {

    const buttonCircle = getButtonCircle(printess, b, isSelected);

    const buttonText = document.createElement("div");
    buttonText.className = "mobile-property-caption";
    buttonText.innerText = printess.gl(b.caption);

    buttonDiv.appendChild(buttonCircle);
    buttonDiv.appendChild(buttonText);

  }
}

function getButtonCircle(printess: iPrintessApi, m: iMobileUIButton, isSelected: boolean): HTMLDivElement {

  const c = printess.getButtonCircleModel(m, isSelected);

  const circle = document.createElement("div");
  circle.className = "circle-button-graphic";
  if (c.hasSvgCircle) {
    circle.appendChild(getSvgCircle(c.displayGauge, c.gaugeValue));
  }
  if (c.hasImage) {
    const image = document.createElement("div");
    image.classList.add("circular-image");
    if (m.circleStyle) image.setAttribute("style", m.circleStyle);
    if (m.thumbCssUrl) image.style.backgroundImage = m.thumbCssUrl;
    circle.appendChild(image);
  }
  if (c.hasCaption) {
    const caption = document.createElement("div");
    caption.className = c.captionClass;
    caption.innerText = printess.gl(c.captionInCircle);
    circle.appendChild(caption);
  }
  if (c.hasColor) {
    const color = document.createElement("div");
    color.classList.add("circular-color");

    color.style.backgroundColor = c.color;
    color.innerText = printess.gl(c.captionInCircle);
    circle.appendChild(color);
  }
  if (c.hasIcon && c.icon !== "none") {

    const icon = printess.getIcon(c.icon);
    icon.classList.add("circle-button-icon");

    circle.appendChild(icon);
    // `<wc-icon class="circle-button-icon" primaryColor="toolbar" icon="${c.icon}"></wc-icon>
  }
  return circle;
}


function getSvgCircle(displayGauge: boolean, gaugeValue: number): SVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttributeNS(null, "viewBox", "0 0 36 36");
  svg.classList.add("circular-svg");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.classList.add("circle-bg");
  path.setAttributeNS(null, "d", "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831");

  svg.appendChild(path);

  if (displayGauge && gaugeValue !== 0) {
    const innerPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    innerPath.classList.add("circle");
    if (gaugeValue < 0) {
      innerPath.setAttributeNS(null, "transform", "scale(-1,1) translate(-36,0)");
    }
    innerPath.setAttributeNS(null, "stroke-dasharray", Math.abs(gaugeValue) + ",100");
    innerPath.setAttributeNS(null, "d", "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831");
    svg.appendChild(innerPath);
  }
  return svg;
}

function centerMobileButton(buttonDiv: HTMLDivElement): void {

  const eX = buttonDiv.offsetLeft;
  const scrollContainer = <HTMLDivElement>document.querySelector(".mobile-buttons-scroll-container");
  const mobileUi = <HTMLDivElement>document.querySelector(".mobile-ui");
  if (scrollContainer && mobileUi) {
    const vw = mobileUi.offsetWidth;
    scrollToLeft(scrollContainer, eX - vw / 2 + buttonDiv.offsetWidth / 2, 300);
    //container.scrollLeft = eX - vw/2 + ele.offsetWidth / 2;
  }

}

function scrollToLeft(element: HTMLDivElement, to: number, duration: number): void {
  const start = element.scrollLeft;
  const change = to - start;
  let currentTime = 0;
  const increment = 10;

  const animateScroll = function () {
    currentTime += increment;
    const val = easeInOutQuad(currentTime, start, change, duration);
    element.scrollLeft = val;
    if (currentTime < duration) {
      setTimeout(animateScroll, increment);
    }
  };
  animateScroll();
}

//t = current time
//b = start value
//c = change in value
//d = duration
function easeInOutQuad(t: number, b: number, c: number, d: number) {
  t /= d / 2;
  if (t < 1) return c / 2 * t * t + b;
  t--;
  return -c / 2 * (t * (t - 2) - 1) + b;
}



/*
 *   Overlay Callbacks
 */
// TODO get overlay style injection 
function getOverlay(printess: iPrintessApi, properties: Array<iExternalProperty>): HTMLElement {
  // console.log("+++++++Properties", properties);
  const isSingleLineText = properties.filter(p => p.kind === "single-line-text").length > 0;
  const isImage = properties.filter(p => p.kind === "image").length > 0;
  const isColor = properties.filter(p => p.kind === "color").length > 0;
  const hdiv = document.createElement("div");

  hdiv.style.opacity = "1";

  if (isSingleLineText) {
    const tdiv = getOverlayIcon(printess, "text", "rgba(255,100,0,1)");
    hdiv.style.border = "5px solid rgba(255,100,0,0.5)";
    hdiv.appendChild(tdiv);
  } else if (isImage) {
    const tdiv = getOverlayIcon(printess, "image", "rgba(0,125,255,1)");
    hdiv.style.border = "5px solid rgba(0,125,255,0.5)";
    hdiv.appendChild(tdiv);

  } else if (isColor) {
    const tdiv = getOverlayIcon(printess, "palette", "rgba(100,250,0,1)");
    hdiv.style.border = "5px solid rgba(100,250,0,0.5)";
    hdiv.appendChild(tdiv);
  } else {
    const tdiv = getOverlayIcon(printess, "cog", "rgba(200,0,100,1)");
    hdiv.style.border = "5px solid rgba(200,0,100,0.5)";
    hdiv.appendChild(tdiv);
  }
  return hdiv;
}

function getOverlayIcon(printess: iPrintessApi, name: iconName, color: string): HTMLDivElement {
  const tdiv = document.createElement("div");
  tdiv.style.position = "absolute";
  tdiv.style.top = "-16px"
  tdiv.style.left = "-16px";
  tdiv.style.backgroundColor = color;
  tdiv.style.padding = "7px";
  tdiv.style.width = "36px";
  tdiv.style.height = "36px";
  tdiv.style.borderRadius = "50%";

  const icon = printess.getIcon(name);
  icon.style.width = "22px";
  icon.style.height = "22px";
  icon.style.color = "white";
  tdiv.appendChild(icon);

  return tdiv;
}


