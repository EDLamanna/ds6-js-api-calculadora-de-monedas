const montoInput = document.getElementById("montoInput");
const calcularBtn = document.getElementById("calcularBtn");
const selectorDeMoneda = document.getElementById("tipoMonedaSelect");
const mostrarResultado = document.getElementById("resultado");
const tituloGrafico = document.getElementById("tituloGrafico");
const mostrarError = document.getElementById("error");

const valorInput = "";

montoInput.addEventListener("input", () => {
  const valorInput = montoInput.value.replace(/\D/g, "");
  if (valorInput === "") {
    montoInput.value = "";
    montoInput.placeholder = "Ingrese el monto en CLP";
    return;
  }
  const numeroMillares = parseInt(valorInput, 10);
  montoInput.value = numeroMillares.toLocaleString("es-CL");
});

let selectorDeMonedaInput = 0;

const actualizarSelectorDeMonedaInput = () => {
  const valorInput = montoInput.value;
  const numeros = valorInput
    .split("")
    .filter((lista) => !isNaN(parseInt(lista)))
    .join("");
  selectorDeMonedaInput = parseFloat(numeros);
};

let monedaDolar,
  monedaEuro,
  monedaBitCoin = "";

const valoresMonedas = async () => {
  try {
    const res = await fetch(`https://mindicador.cl/api/`);
    const data = await res.json();
    monedaDolar = data["dolar"].valor;
    monedaEuro = data["euro"].valor;
    monedaBitCoin = data["bitcoin"].valor;
  } catch (error) {
    mostrarError.innerHTML =
      "Lo sentimos, ha ocurrido un error inesperado. Por favor, inténtalo de nuevo más tarde.";
  }
};

const obtenerDatosMoneda = async (monedaseleccionada) => {
  try {
    const urls = {
      dolar: "https://mindicador.cl/api/dolar/",
      euro: "https://mindicador.cl/api/euro/",
      bitcoin: "https://mindicador.cl/api/bitcoin/",
    };

    const url = urls[monedaseleccionada.toLowerCase()];
    if (!url) throw new Error("Moneda no soportada");

    const res = await fetch(url);
    const data = await res.json();
    const serie = data.serie;
    return serie.slice(0, 10);
  } catch (error) {
    throw new Error(
      `Ha ocurrido un error al obtener los datos de ${monedaseleccionada}.`
    );
  }
};

const formatearDatosParaGrafico = (datos, monedaSeleccionada) => {
  try {
    let fechasMapedas = datos.map((valor) => {
      const fecha = new Date(valor.fecha);
      const dia = fecha.getDate().toString().padStart(2, "0");
      const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
      const año = fecha.getFullYear();
      return `${dia}-${mes}-${año}`;
    });

    let valoresMapeados = datos.map((valor) => valor.valor);

    fechasMapedas = fechasMapedas.reverse();
    valoresMapeados = valoresMapeados.reverse();

    const datasets = [
      {
        label: monedaSeleccionada,
        borderColor: "rgb(255, 99, 132)",
        data: valoresMapeados,
      },
    ];

    return { labels: fechasMapedas, datasets };
  } catch (error) {
    throw new Error(
      "Ha ocurrido un error al formatear los datos para el gráfico."
    );
  }
};

let myChart;

const renderGrafica = async () => {
  let data;
  const monedaSeleccionada = selectorDeMoneda.value.toLowerCase();

  try {
    data = await obtenerDatosMoneda(monedaSeleccionada);
    const datosFormateados = formatearDatosParaGrafico(
      data,
      monedaSeleccionada
    );
    const config = {
      type: "line",
      data: datosFormateados,
    };

    if (myChart) {
      myChart.destroy();
    }

    const canvas = document.getElementById("miCuadro");
    myChart = new Chart(canvas, config);
    canvas.style.backgroundColor = "white";
  } catch (error) {
    mostrarError.innerHTML =
      "Lo sentimos, ha ocurrido un error inesperado. Por favor, inténtalo de nuevo más tarde.";
  }
};

calcularBtn.addEventListener("click", () => {
  actualizarSelectorDeMonedaInput();

  if (montoInput.value.trim() === "") {
    alert("Debe introducir un valor para calcular.");
    return;
  }

  let conversion;
  if (selectorDeMoneda.value === "dolar") {
    conversion = selectorDeMonedaInput / parseFloat(monedaDolar);
  } else if (selectorDeMoneda.value === "euro") {
    conversion = selectorDeMonedaInput / parseFloat(monedaEuro);
  } else if (selectorDeMoneda.value === "bitcoin") {
    conversion = selectorDeMonedaInput / parseFloat(monedaBitCoin);
  }

  const conversionConFormatoMillares = conversion.toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  mostrarResultado.innerHTML = `Resultado: $${conversionConFormatoMillares}`;

  tituloGrafico.innerHTML = `Comportamiento`;
  renderGrafica();
});

valoresMonedas();