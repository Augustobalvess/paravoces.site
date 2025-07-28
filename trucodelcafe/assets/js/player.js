const vturbVideos = [
    { videoId: '676a073a4aa6730f71770c54', delayInSeconds: 1512, utm: '' },
    { videoId: '676a0423572299dbc2d8f217', delayInSeconds: 1650, utm: '' },
    { videoId: '676a0a900534b8c67a17177a', delayInSeconds: 1576, utm: '' },
    { videoId: '676a0f170534b8c67a171895', delayInSeconds: 1555, utm: '' },
    { videoId: '677f0a87e35f0f159c7914af', delayInSeconds: 1571, utm: '' },
    { videoId: '6780c5ef2215c4312816e86c', delayInSeconds: 1505, utm: '' },
    { videoId: '6780c4083fb661b22f149c29', delayInSeconds: 1645, utm: '' },
    { videoId: '6780c78c3fb661b22f149d7d', delayInSeconds: 1550, utm: '' },
    { videoId: '678ef96d0cb4342a3c10586f', delayInSeconds: 1572, utm: '' },
    { videoId: '679588140dfbe29127379034', delayInSeconds: 1635, utm: '' },
    { videoId: '67b2232ffc5d81ed39099c88', delayInSeconds: 1630, utm: '' },
    { videoId: '67b22483232bb2faa057ce9f', delayInSeconds: 1690, utm: '' },
    { videoId: '67b2251a70ef2b721962a38c', delayInSeconds: 1765, utm: '' },
    { videoId: '67b223c712b91adfee0edb81', delayInSeconds: 1825, utm: '' },
    { videoId: '67b8eacf567353c080f4b97b', delayInSeconds: 1573, utm: '' },
    { videoId: '67b8e7d0d6145bd1001d00d0', delayInSeconds: 1711, utm: '' },
    { videoId: '67b8e9386930c8feb34af033', delayInSeconds: 1614, utm: '' },
    { videoId: '67b8eacf567353c080f4b97b', delayInSeconds: 1573, utm: '' },
    { videoId: '67b8e7d0d6145bd1001d00d0', delayInSeconds: 1711, utm: '' },
    { videoId: '67da27dc2f414d737e77bb3b', delayInSeconds: 1736, utm: '' },
    { videoId: '67da0b5acf60035979dca614', delayInSeconds: 1726, utm: '' },
    { videoId: '67da1341ef3a34e9c25b8d41', delayInSeconds: 1692, utm: '' },
    { videoId: '67da32ddd7483140818bda7a', delayInSeconds: 1741, utm: '' },
    { videoId: '67da1e73cf60035979dcb7b0', delayInSeconds: 1756, utm: '' },
    { videoId: '67da2d9fd7483140818bd67d', delayInSeconds: 1777, utm: '' },
    { videoId: '67e409ae15bf4ea88c573fd8', delayInSeconds: 1725, utm: '' },
    { videoId: '67e3f3d3b2f49422d195778a', delayInSeconds: 1631, utm: '' },
    { videoId: '67e3f24d3be70a945930464a', delayInSeconds: 1631, utm: '' },
    { videoId: '67f91e433c95e6f39159c0fa', delayInSeconds: 1775, utm: '' },
];

document.addEventListener('DOMContentLoaded', function () {
    var SECONDS_TO_DISPLAY_WHATSAPP = 99999;
    var SECONDS_TO_DISPLAY = 1650;

    var CLASS_TO_DISPLAY = 'esconder';

    /* DAQUI PARA BAIXO NAO PRECISA ALTERAR */
    var attempts = 0;
    var elsHiddenList = [];
    var elsDisplayed = false;
    var elsHidden = document.querySelectorAll(`.${CLASS_TO_DISPLAY}`);
    var alreadyDisplayedKey = `alreadyElsDisplayed${SECONDS_TO_DISPLAY}`;
    var alreadyElsDisplayed = localStorage.getItem(alreadyDisplayedKey);

    var whatsappDisplayed = false;
    var alreadyDisplayedKeyWhatsApp = `alreadyElsDisplayedWpp${SECONDS_TO_DISPLAY_WHATSAPP}`;
    var alreadyElsDisplayedWhatsApp = localStorage.getItem(alreadyDisplayedKeyWhatsApp);

    elsHiddenList = Array.prototype.slice.call(elsHidden);

    var showHiddenElements = function () {
        elsDisplayed = true;
        elsHiddenList.forEach(e => e.classList.remove('esconder'));
        localStorage.setItem(alreadyDisplayedKey, true);
        window.dispatchEvent(new CustomEvent('showHiddenElements'));
    };

    var showHiddenWhatsApp = function () {
        if (whatsappDisplayed) return;

        whatsappDisplayed = true;
        var el = document.querySelector('.whatsapp-button');
        el.classList.remove('esconder-whatsapp');
        localStorage.setItem(alreadyDisplayedKeyWhatsApp, true);
    };

    var startWatchVideoProgress = function () {
        if (
            typeof smartplayer === 'undefined' ||
            !(smartplayer.instances && smartplayer.instances.length)
        ) {
            if (attempts >= 10) return;
            attempts += 1;
            return setTimeout(function () {
                startWatchVideoProgress();
            }, 1000);
        }

        console.log('teste a/b delay script loaded');
        const buttonLinks = document.querySelectorAll('a');
        vturbVideos.forEach(video => {
            if (smartplayer.instances[0].analytics.player.options.id == video.videoId) {
                utmPrefix = window.location.search ? '&' : '?';
                const queryString =
                    window.location.search.replace('utm_source=FB', '') + utmPrefix + video.utm;
                if (buttonLinks[0].href.includes(video.utm)) return;
                buttonLinks.forEach(buttonLink => {
                    if (buttonLink.href.includes('?')) {
                        buttonLink.href += queryString.replace('?', '&');
                    } else {
                        buttonLink.href += queryString;
                    }
                });
            }
        });

        vturbVideos.forEach(video => {
            if (smartplayer.instances[0].analytics.player.options.id == video.videoId) {
                SECONDS_TO_DISPLAY = video.delayInSeconds;
                console.log('Delay personalizado encontrado.');
            }
        });
        
        console.log('Delay definido para:', SECONDS_TO_DISPLAY);

        smartplayer.instances[0].on('timeupdate', () => {
            var currentTime = smartplayer.instances[0].video.currentTime;

            if (elsDisplayed || smartplayer.instances[0].smartAutoPlay) return;

            if (!alreadyElsDisplayedWhatsApp && currentTime >= SECONDS_TO_DISPLAY_WHATSAPP) {
                showHiddenWhatsApp();
            }

            if (currentTime < SECONDS_TO_DISPLAY) return;

            showHiddenElements();
        });
    };

    if (alreadyElsDisplayed === 'true') {
        showHiddenElements();
    } else {
        startWatchVideoProgress();
    }

    if (alreadyElsDisplayedWhatsApp === 'true') showHiddenWhatsApp();
});
