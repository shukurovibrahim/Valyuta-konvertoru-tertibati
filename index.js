const leftCurrenciesContainer = document.querySelector(".convert .currency");
const rightCurrenciesContainer = document.querySelector(".converted .currency");
const leftCurrencyRate = document.querySelector(".convert .currency-text");
const rightCurrencyRate = document.querySelector(".converted .currency-text");
const leftInput = document.querySelector(".convert input");
const rightInput = document.querySelector(".converted input");

const inputPartsMaxLength = 5;
const token = "9c2f69afc136cf4c7ca88988c5443f9c";

let leftActiveCurrency = "rub",
  rightActiveCurrency = "usd";

const generateRateString = (value, currentCurrency, oppositeCurrency) =>
  `1 ${currentCurrency.toUpperCase()} = ${validateValue(
    (value || "").toString(),
  )} ${oppositeCurrency.toUpperCase()}`;

const renderCurrencyRate = () => {
  if (leftActiveCurrency === rightActiveCurrency) {
    leftCurrencyRate.innerText = "";
    rightCurrencyRate.innerText = "";
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
      if (current.success) {
        leftCurrencyRate.innerText = generateRateString(
          current.result,
          leftActiveCurrency,
          rightActiveCurrency,
        );
      }
      if (opposite.success) {
        rightCurrencyRate.innerText = generateRateString(
          opposite.result,
          rightActiveCurrency,
          leftActiveCurrency,
        );
      }
    });
  }
};

const convertCurrency = async (from, to, amount) => {
  const url = `http://api.exchangerate.host/convert?from=${from.toUpperCase()}&to=${to.toUpperCase()}&amount=${amount}&access_key=${token}`;

  try {
    const res = await fetch(url);
    return await res.json();
  } catch (e) {
    throw new Error(`Failed to fetch currency rates.`);
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
      activeCurrency: leftActiveCurrency,
      oppositeCurrency: rightActiveCurrency,
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
      activeCurrency: rightActiveCurrency,
      oppositeCurrency: leftActiveCurrency,
    });

    renderCurrencyRate();
  });
};

const renderButtons = (currencies) => {
  currencies.forEach(renderCurrencyButton);
};

const currencies = ["rub", "usd", "eur", "gbp"];
renderButtons(currencies);

const validateValue = (value) => {
  value = value.replace(",", ".");
  const hasDotInEnd = value.endsWith(".");
  let [fullPart, dotPart] = value.split(".");
  if (fullPart.length > inputPartsMaxLength) {
    fullPart = fullPart.slice(0, inputPartsMaxLength);
  }

  if (dotPart && dotPart.length > inputPartsMaxLength) {
    dotPart = dotPart.slice(0, inputPartsMaxLength);
  }

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

  const convertedValue = await convertCurrency(
    activeCurrency,
    oppositeCurrency,
    currentInput.value.toString(),
  );
  if (!convertedValue.success) return;
  otherInput.value = validateValue(convertedValue.result.toString());
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

    input.value = validateValue(input.value);
    await convertValue({
      currentInput: input,
      otherInput,
      activeCurrency,
      oppositeCurrency,
    });
  });
};

handleInput(leftInput, true);
handleInput(rightInput, false);
renderCurrencyRate();
