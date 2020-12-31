/*Global Variables*/
const selectTag = document.querySelector("select");
//Enum for the different Mixed option states
const mixedStates = {
    NONE:0,
    INITIAL:1
};
/*Set color of popup menu based on theme*/
function setCss(chosenTheme) {
    const {colors} = chosenTheme.definition
    const styles = `
.popup-header {
background-color: ${colors.headerColor};
}

.popup-body {
background-color: ${colors.baseBackground};
}
        `
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet)
}

/*EVENT: Retrieve the selected waifu.
Afterwards, send the chosen waifu to the background script.*/
function setTheme(e) {
    browser.storage.local.get("waifuThemes")
        .then((storage) => {
            let chosenThemeId = e.target.value;
            let currentMix = chosenThemeId === "mixed" ? mixedStates.INITIAL : mixedStates.NONE;
            if(currentMix === mixedStates.NONE){
                if (chosenThemeId === "random") {
                    chosenThemeId = getRandomTheme(storage.waifuThemes.themes);
                }
                if(storage.waifuThemes.themes[chosenThemeId]){
                    setCss(storage.waifuThemes.themes[chosenThemeId]);
                }
            }
            browser.runtime.sendMessage({currentThemeId: chosenThemeId,mixState:currentMix});
        });
}
/*Selects a waifu at random*/
function getRandomTheme(themes) {
    themes = Object.keys(themes);
    let randNum = getRandomNumber(0, themes.length);
    return themes[randNum];
}

/*Retrieves a random number from min(inclusive) to max(exclusive)*/
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/*Setup Waifu Choices for the popup menu
* Also categorizes each theme based on their type (dark/light)*/
function initChoice() {
    browser.storage.local.get(["waifuThemes", "currentThemeId","mixedTabs"])
        .then((storage) => {
            const themes = Object.values(storage.waifuThemes.themes)
                .sort((a, b) => a.name.localeCompare(b.name));
            const darkGroup = document.querySelector("optgroup[label='Dark Variant']");
            const lightGroup = document.querySelector("optgroup[label='Light Variant']");
            themes.forEach(theme => {
                const opt = document.createElement("option");
                const themeInformation = theme.definition.information;
                opt.setAttribute("value", themeInformation.id);
                opt.id = themeInformation.id
                const txtNode = document.createTextNode(theme.name);
                opt.append(txtNode);
                if (themeInformation.dark) {
                    darkGroup.append(opt);
                } else {
                    lightGroup.append(opt);
                }
            });
            /*Set the theme of the popup menu based on current tab color*/
            browser.tabs.query({active:true})
                .then((tabs)=>{
                    const activeTab = tabs[0];
                    if(activeTab && storage.mixedTabs){
                        const themes = storage.waifuThemes.themes;
                        const tabThemeId = storage.mixedTabs.get(activeTab.id);
                        setCss(themes[tabThemeId]);
                        selectTag.options.selectedIndex =
                            selectTag.options.namedItem(tabThemeId).index;
                    }
                })
        });
}
initChoice();
/*---Event Listeners---*/
selectTag.addEventListener("change", setTheme, true);
