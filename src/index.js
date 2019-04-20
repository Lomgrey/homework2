import "babel-polyfill";
import Chart from "chart.js";

const currencyURL = "www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const meteoURL = "xml.meteoservice.ru/export/gismeteo/point/140.xml";

async function loadCurrency() {
  const parser = new DOMParser();
  
  const xmlTest = await fetch(currencyURL).then(r => r.text());
  const currencyData = parser.parseFromString(xmlTest, "text/xml");
  // <Cube currency="USD" rate="1.1321" />
  const rates = currencyData.querySelectorAll("Cube[currency][rate]");

  const result = Object.create(null);
  for (let i = 0; i < rates.length; i++) {
    const rateTag = rates.item(i);
    const rate = rateTag.getAttribute("rate");
    const currency = rateTag.getAttribute("currency");
    result[currency] = rate;
  }
  result["EUR"] = 1;

  return result;
}

function normalizeDataByCurrency(data, currency) {
  const result = Object.create(null);
  const value = data[currency];
  for (const key of Object.keys(data)) {
    result[key] = value / data[key];
  }
  return result;
}

async function loadMeteo() {
  const parser = new DOMParser();

  const xmlData = await fetch(meteoURL).then(r => r.text());
  const meteoData = parser.parseFromString(xmlData, "application/xml");

  const forecasts = meteoData.querySelectorAll(
    "FORECAST[day][month][hour]"
  );
  const temperatures = meteoData.querySelectorAll(
    "TEMPERATURE[max][min]"
  );

  const result = Object.create(null);
  for (let i = 0; i < forecasts.length; i++) {
    const forecast = forecasts.item(i);
    const temperature = temperatures.item(i);
    
    const date = dateOfForecast(forecast);

    const max = temperature.getAttribute("max");
    const min = temperature.getAttribute("min");
    
    result[date] = {max, min};
  }

  return result;
}

function dateOfForecast(forecast){
  const day = forecast.getAttribute("day");
  const month = forecast.getAttribute("month");
  const hour = forecast.getAttribute("hour");

  return hour + "h. " + day + "." + month;
}

const btnMeteoBuild = document.getElementById("btnMeteo");
const btnCurrencyBuild = document.getElementById("btnCurrency");
const canvasCtx = document.getElementById("out").getContext("2d");

btnMeteoBuild.addEventListener("click", async function() {
  const meteoData = await loadMeteo();
  const keys = Object.keys(meteoData);

  const maxValues = keys.map(key => meteoData[key].max);
  const minValues = keys.map(key => meteoData[key].min);
  const chartConfig = {
    type: "line",

    data: {
      labels: keys,
      datasets: [
        {
          label: "Минимальная температура",
          backgroundColor: "rgb(180, 180, 255)",
          borderColor: "rgb(150, 150, 255)",
          data: minValues
        },
        {
          label: "Максимальная температура",
          backgroundColor: "rgb(255, 20, 20)",
          borderColor: "rgb(180, 0, 0)",
          data: maxValues
        }
      ]
    }
  };
  
  updateChart(chartConfig);
});

btnCurrencyBuild.addEventListener("click", async function() {
  const currencyData = await loadCurrency();
  const normalData = normalizeDataByCurrency(currencyData, "RUB");
  const keys = Object.keys(normalData).sort((k1, k2) =>
    compare(normalData[k1], normalData[k2])
  );
  const plotData = keys.map(key => normalData[key]);

  const chartConfig = {
    type: "line",

    data: {
      labels: keys,
      datasets: [
        {
          label: "Стоимость валюты в рублях",
          backgroundColor: "rgb(255, 20, 20)",
          borderColor: "rgb(180, 0, 0)",
          data: plotData
        }
      ]
    }
  };

  updateChart(chartConfig);
});

function updateChart(chartConfig){
  window.chart = new Chart(canvasCtx, chartConfig);
}

function compare(a, b) {
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}