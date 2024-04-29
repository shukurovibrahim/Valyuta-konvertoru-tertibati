const leftCurrenciesContainer = document.querySelector(".convert .currency");
const rightCurrenciesContainer = document.querySelector(".converted .currency");
const leftCurrencyRate = document.querySelector(".convert .currency-text");
const rightCurrencyRate = document.querySelector(".converted .currency-text");
const leftInput = document.querySelector(".convert input");
const rightInput = document.querySelector(".converted input");

const inputPartsMaxLength = 5;
const token = "c3fe442838982f0c20c0becb";
const currencies = ["rub", "usd", "eur", "gbp"];

let leftActiveCurrency = currencies[0],
  rightActiveCurrency = currencies[1];

  
const generateRateString = (value, currentCurrency, oppositeCurrency) =>
  [
    1,
    currentCurrency.toUpperCase(),
    "=",
    validateValue((value || "").toString()),
    oppositeCurrency.toUpperCase(),
  ].join(" ");

const renderCurrencyRate = () => {
  if (leftActiveCurrency === rightActiveCurrency) {
    leftCurrencyRate.innerText = generateRateString(
      1,
      leftActiveCurrency,
      rightActiveCurrency,
    );
    rightCurrencyRate.innerText = generateRateString(
      1,
      rightActiveCurrency,
      leftActiveCurrency,
    );
  } else {
    leftCurrencyRate.innerText = generateRateString(
      null,
      leftActiveCurrency,
      rightActiveCurrency,
    );
    rightCurrencyRate.innerText = generateRateString(
      null,
      rightActiveCurrency,
      leftActiveCurrency,
    );

    Promise.all([
      convertCurrency(leftActiveCurrency, rightActiveCurrency, 1),
      convertCurrency(rightActiveCurrency, leftActiveCurrency, 1),
    ]).then(([current, opposite]) => {
      leftCurrencyRate.innerText = generateRateString(
        current,
        leftActiveCurrency,
        rightActiveCurrency,
      );

      rightCurrencyRate.innerText = generateRateString(
        opposite,
        rightActiveCurrency,
        leftActiveCurrency,
      );
    });
  }
};

const convertCurrency = async (from, to, amount) => {
  if (!navigator.onLine) {
    console.log("The currency converter is not available offline.");
    const hiddenDisplay = document.querySelector(".hidden");
    hiddenDisplay.style.display = 'block';
    return;
  } else {
    const hiddenDisplay = document.querySelector(".hidden");
    hiddenDisplay.style.display = 'none';
  }
  
  const url = `https://v6.exchangerate-api.com/v6/${token}/latest/${from}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.conversion_rates[to.toUpperCase()] * +amount;
  } catch (error) {
    console.error("Failed to fetch currency rates:", error);
    throw new Error("Failed to fetch currency rates.");
  }
};

const renderCurrencyButton = (currency) => {
  const leftBtn = document.createElement("button");
  leftBtn.textContent = currency.toUpperCase();
  leftCurrenciesContainer.appendChild(leftBtn);
  if (currency === leftActiveCurrency) leftBtn.classList.add("active");
  leftBtn.addEventListener("click", async () => {
    document
      .querySelector(".convert .currency .active")
      .classList.remove("active");
    leftBtn.classList.add("active");
    leftActiveCurrency = currency;

    await convertValue({
      currentInput: rightInput,
      otherInput: leftInput,
      activeCurrency: rightActiveCurrency,
      oppositeCurrency: leftActiveCurrency,
    });

    renderCurrencyRate();
  });

  const rightBtn = document.createElement("button");
  rightBtn.textContent = currency.toUpperCase();
  rightCurrenciesContainer.appendChild(rightBtn);
  if (currency === rightActiveCurrency) rightBtn.classList.add("active");
  rightBtn.addEventListener("click", async () => {
    document
      .querySelector(".converted .currency .active")
      .classList.remove("active");
    rightBtn.classList.add("active");
    rightActiveCurrency = currency;

    await convertValue({
      currentInput: leftInput,
      otherInput: rightInput,
      activeCurrency: leftActiveCurrency,
      oppositeCurrency: rightActiveCurrency,
    });

    renderCurrencyRate();
  });
};



const renderButtons = (currencies) => {
  currencies.forEach(renderCurrencyButton);
};


const validateValue = (value) => {
  value = value.replace(",", ".");
  const hasDotInEnd = value.endsWith(".");
  let [fullPart, dotPart] = value.split(".");
  return [fullPart, hasDotInEnd || dotPart?.length > 0 ? "." : "", dotPart]
    .filter(Boolean)
    .join("");
};

const convertValue = async ({
  currentInput,
  otherInput,
  activeCurrency,
  oppositeCurrency,
}) => {
  const val = currentInput.value;
  if (val.length === 0) {
    otherInput.value = "";
    return;
  }

  if (activeCurrency === oppositeCurrency) {
    otherInput.value = currentInput.value;
    return;
  }

  let convertedValue = await convertCurrency(
    activeCurrency,
    oppositeCurrency,
    currentInput.value.toString(),
  );

  if (!convertedValue) return;
  convertedValue = convertedValue.toFixed(5);
  otherInput.value = convertedValue;
};


const handleInput = (input, isLeft) => {
  input.addEventListener("input", async () => {
    const activeCurrency = isLeft ? leftActiveCurrency : rightActiveCurrency;
    const oppositeCurrency = isLeft ? rightActiveCurrency : leftActiveCurrency;
    const otherInput = isLeft ? rightInput : leftInput;

    if (!input.value) {
      otherInput.value = "";
      return;
    }
    input.value = input.value
      .replace(/[^\d.,]/, "")
      .replace(/^0{2,}/, "0")
      .replace(/^0(\d)/, "$1");
    if (input.value.startsWith(".")) input.value = "0" + input.value;
    if (input.value.endsWith(",")) input.value = input.value;
    input.value = validateValue(input.value);

    if (input.value === "0") {
      otherInput.value = "0";
      return;
    }

    await convertValue({
      currentInput: input,
      otherInput,
      activeCurrency,
      oppositeCurrency,
    });
  });
};

const main = () => {
  if (!navigator.onLine) {
    alert("The currency converter is not available offline.");
    return;
  }

  renderButtons(currencies);

  handleInput(leftInput, true);
  handleInput(rightInput, false);

  renderCurrencyRate();
};

window.addEventListener("load", main);


window.addEventListener('online', () => {
  const hiddenDisplay = document.querySelector(".hidden");
  hiddenDisplay.style.display = 'none';
});

window.addEventListener('offline', () => {
  const hiddenDisplay = document.querySelector(".hidden");
  hiddenDisplay.style.display = 'block';
});