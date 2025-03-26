const apiUrl = "https://decision.cs.taltech.ee/electricity/data/ed9f4fcf0bfb1afa1741424674";

d3.json(apiUrl).then(data => {
    console.log(data)
})