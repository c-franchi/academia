document.getElementById('upload-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Pegando a primeira planilha
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

            // Convertendo a planilha para um JSON
            const excelData = XLSX.utils.sheet_to_json(firstSheet);

            // Passa os dados convertidos para gerar o gráfico
            prepareInitialGraph(excelData);
        };
        reader.readAsArrayBuffer(file);
    }
});

function prepareInitialGraph(data) {
    const labels = data.map(row => row.dias); // Dias
    const totalDays = labels.length;
    const maxValue = totalDays; // Máximo valor que o Y pode atingir
    const initialData = Array(totalDays).fill(null); // Dados iniciais como null

    // Configuração inicial do gráfico com as linhas de referência sem dados
    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Marina',
                data: initialData,
                borderColor: 'rgb(255, 99, 132)',
                fill: false,
                tension: 0.1,
            },
            {
                label: 'Raquel',
                data: initialData.slice(), // Cópia dos dados iniciais
                borderColor: 'rgb(54, 162, 235)',
                fill: false,
                tension: 0.1,
            },
            {
                label: 'Poliana',
                data: initialData.slice(),
                borderColor: 'rgb(75, 192, 192)',
                fill: false,
                tension: 0.1,
            }
        ]
    };

    const ctx = document.getElementById('academyChart').getContext('2d');
    const academyChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            animation: false, // Sem animação inicial
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Dias'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Frequência Acumulada'
                    },
                    beginAtZero: true,
                    max: maxValue // Definindo o valor máximo do Y como o total de dias
                }
            }
        }
    });

    // Iniciar a animação para preencher os pontos gradualmente
    animateGraph(data, academyChart);
}

function animateGraph(data, academyChart) {
    let marinaAccumulated = 0;
    let raquelAccumulated = 0;
    let polianaAccumulated = 0;

    let dayIndex = 0;

    function updateChart() {
        if (dayIndex < data.length) {
            let currentDay = data[dayIndex];

            // Certificar-se de que estamos lidando com números, convertendo strings em inteiros
            marinaAccumulated += isNaN(parseInt(currentDay.marina)) ? 0 : parseInt(currentDay.marina);
            raquelAccumulated += isNaN(parseInt(currentDay.raquel)) ? 0 : parseInt(currentDay.raquel);
            polianaAccumulated += isNaN(parseInt(currentDay.poliana)) ? 0 : parseInt(currentDay.poliana);

            // Adicionando os valores progressivamente
            academyChart.data.datasets[0].data[dayIndex] = marinaAccumulated;
            academyChart.data.datasets[1].data[dayIndex] = raquelAccumulated;
            academyChart.data.datasets[2].data[dayIndex] = polianaAccumulated;

            academyChart.update();

            dayIndex++;
            // Chama a função novamente após 1 segundo (1000ms)
            setTimeout(updateChart, 300); // Intervalo entre a atualização de cada dia
        } else {
            // Exibir o ranqueamento quando a animação terminar
            displayRanking(marinaAccumulated, raquelAccumulated, polianaAccumulated);
        }
    }

    // Iniciar a animação do gráfico
    updateChart();
}

function displayRanking(marina, raquel, poliana) {
    const ranking = [
        { name: 'Marina', value: marina },
        { name: 'Raquel', value: raquel },
        { name: 'Poliana', value: poliana }
    ];

    // Ordenar pelo valor acumulado (decrescente)
    ranking.sort((a, b) => b.value - a.value);

    // Criar a mensagem de ranqueamento
    let message = '<p>Ranking final de frequência na academia:</p>';
    ranking.forEach((person, index) => {
        message += `<p><strong>${index + 1}º lugar</strong>: ${person.name} com ${person.value} idas à academia</p>`;
    });

    // Inserir o conteúdo no modal
    document.getElementById('rankingBody').innerHTML = message;

    // Exibir o modal do Bootstrap
    const rankingModal = new bootstrap.Modal(document.getElementById('rankingModal'));
    rankingModal.show();
}
