const axios = require('axios');
(async () => {
    try {
        const res = await axios.get('https://api.zenrows.com/v1/', {
            params: {
                url: 'https://httpbin.org/ip',
                apikey: '3df14f83a61dff62e821cf25468a2af3c34c5eda',
                js_render: 'true'
            }
        });
        console.log('✅ Success:', res.data);
    } catch (e) {
        console.error('❌ Error:', e.response ? JSON.stringify(e.response.data) : e.message);
    }
})();
