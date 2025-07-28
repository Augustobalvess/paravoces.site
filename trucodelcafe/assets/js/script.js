// Delay para o carregamento do vídeo
const DELAY_VIDEO = 0;

// Ativa/desativa o Google Tag Manager
const ATIVAR_GTM = false;
// Delay para o carregamento do Google Tag Manager
const DELAY_GTM = 99999;

const notificacoes = [
    {
        nome: 'Antônio Carlos Oliveira, em Minas Gerais',
        quantidade: 'Comprou 5 Frascos - LibidControl',
        tempo: 'Há 18 minutos',
    },
    {
        nome: 'José Ricardo Silva, em São Paulo',
        quantidade: 'Comprou 10 Frascos - LibidControl',
        tempo: 'Há 31 minutos',
    },
    {
        nome: 'Paulo Sérgio Costa, em Rio de Janeiro',
        quantidade: 'Comprou 10 Frascos - LibidControl',
        tempo: 'Há 12 minutos',
    },
    {
        nome: 'Marcos Antônio Souza, em Goiás',
        quantidade: 'Comprou 5 Frascos - LibidControl',
        tempo: 'Há 2 minutos',
    },
    {
        nome: 'Joelma Soares, em Santa Catarina',
        quantidade: 'Comprou 5 Frascos - LibidControl',
        tempo: 'Há 46 minutos',
    },
    {
        nome: 'Roberto Luiz, em São Paulo',
        quantidade: 'Comprou 5 Frascos - LibidControl',
        tempo: 'Há 1 minuto',
    },
    {
        nome: 'Eduardo Henrique, em Paraná',
        quantidade: 'Comprou 5 Frascos - LibidControl',
        tempo: 'Há 19 minutos',
    },
    {
        nome: 'Fábio Augusto, em São Paulo',
        quantidade: 'Comprou 3 Frascos - LibidControl',
        tempo: 'Há 4 minutos',
    },
    {
        nome: 'Cláudio Roberto, em Pará',
        quantidade: 'Comprou 3 Frasco - LibidControl',
        tempo: 'Há 55 minutos',
    },
    {
        nome: 'Carlos Alberto, em Mato Grosso',
        quantidade: 'Comprou 5 Frascos - LibidControl',
        tempo: 'Há 6 minutos',
    },
    {
        nome: 'Renato José, em Rio Grande do Sul',
        quantidade: 'Comprou 3 Frascos - LibidControl',
        tempo: 'Há 19 minutos',
    },
    {
        nome: 'Ricardo Gonçalves, em Rio de Janeiro',
        quantidade: 'Comprou 3 Frascos - LibidControl',
        tempo: 'Há 21 minutos',
    },
    {
        nome: 'Luiz Fernando, em Alagoas',
        quantidade: 'Comprou 5 Frascos - LibidControl',
        tempo: 'Há 10 minutos',
    },
    {
        nome: 'Wagner Silva, em Paraná',
        quantidade: 'Comprou 3 Frascos - LibidControl',
        tempo: 'Há 47 minutos',
    },
    {
        nome: 'Sérgio Henrique, em Espírito Santo',
        quantidade: 'Comprou 3 Frascos - LibidControl',
        tempo: 'Há 1 minuto',
    },
    {
        nome: 'André Luiz, em Bahia',
        quantidade: 'Comprou 3 Frascos - LibidControl',
        tempo: 'Há 22 minutos',
    },
    {
        nome: 'Gilberto José, em Pernambuco',
        quantidade: 'Comprou 3 Frascos - LibidControl',
        tempo: 'Há 35 minutos',
    },
    {
        nome: 'Roberto Almeida, em São Paulo',
        quantidade: 'Comprou 5 Frascos - LibidControl',
        tempo: 'Há 59 minutos',
    },
    {
        nome: 'Lucas Barbosa, em Ceará',
        quantidade: 'Comprou 5 Frasco - LibidControl',
        tempo: 'Há 40 minutos',
    },
    {
        nome: 'Pedro Gomes, em Rio de Janeiro',
        quantidade: 'Comprou 3 Frascos - LibidControl',
        tempo: 'Há 2 minutos',
    },
    {
        nome: 'Ivan Silva, em Espírito Santo',
        quantidade: 'Comprou 5 Frasco - LibidControl',
        tempo: 'Há 28 minutos',
    },
    {
        nome: 'Patrick Ferreira, em Santa Catarina',
        quantidade: 'Comprou 5 Frascos - LibidControl',
        tempo: 'Há 12 minutos',
    },
    {
        nome: 'Claudio Moreira, em Rondônia',
        quantidade: 'Comprou 3 Frascos - LibidControl',
        tempo: 'Há 56 minutos',
    },
    {
        nome: 'Ygor Lima, em Maranhão',
        quantidade: 'Comprou 1 Frasco - LibidControl',
        tempo: 'Há 50 minutos',
    },
    {
        nome: 'Mariano Souza, em São Paulo',
        quantidade: 'Comprou 5 Frascos - LibidControl',
        tempo: 'Há 15 minutos',
    },
];

function slideToggle(element, duration = 400) {
    // Se o elemento está oculto, mostramos
    if (window.getComputedStyle(element).display === 'none') {
        return slideDown(element, duration);
    }
    // Caso contrário, ocultamos
    return slideUp(element, duration);
}

function slideUp(element, duration = 400) {
    element.style.height = element.offsetHeight + 'px';
    element.style.transitionProperty = 'height, margin, padding';
    element.style.transitionDuration = duration + 'ms';
    element.style.boxSizing = 'border-box';
    element.style.overflow = 'hidden';

    // Forçar um "reflow" para aplicar a transição
    element.offsetHeight;

    element.style.height = 0;
    element.style.paddingTop = 0;
    element.style.paddingBottom = 0;
    element.style.marginTop = 0;
    element.style.marginBottom = 0;

    setTimeout(() => {
        element.style.display = 'none';
        element.style.removeProperty('height');
        element.style.removeProperty('padding-top');
        element.style.removeProperty('padding-bottom');
        element.style.removeProperty('margin-top');
        element.style.removeProperty('margin-bottom');
        element.style.removeProperty('overflow');
        element.style.removeProperty('transition-duration');
        element.style.removeProperty('transition-property');
    }, duration);
}

function slideDown(element, duration = 400) {
    element.style.removeProperty('display');
    let display = window.getComputedStyle(element).display;

    if (display === 'none') display = 'block';

    element.style.display = display;
    let height = element.offsetHeight;
    element.style.height = 0;
    element.style.paddingTop = 0;
    element.style.paddingBottom = 0;
    element.style.marginTop = 0;
    element.style.marginBottom = 0;
    element.style.overflow = 'hidden';
    element.style.transitionProperty = 'height, margin, padding';
    element.style.transitionDuration = duration + 'ms';
    element.style.boxSizing = 'border-box';

    // Forçar um "reflow" para aplicar a transição
    element.offsetHeight;

    element.style.height = height + 'px';
    element.style.paddingTop = '';
    element.style.paddingBottom = '';
    element.style.marginTop = '';
    element.style.marginBottom = '';

    setTimeout(() => {
        element.style.removeProperty('height');
        element.style.removeProperty('overflow');
        element.style.removeProperty('transition-duration');
        element.style.removeProperty('transition-property');
    }, duration);
}

const loadVturb = () => {
    document.querySelectorAll('script[data-src$="player.js"]').forEach(script => {
        const src = script.getAttribute('data-src');
        script.setAttribute('src', src);
    });
};

const likeComment = id => {
    const comment = document.querySelector(`[data-comment-id="${id}"]`);
    const likesNumber = Number(comment.querySelector('likes').innerText);

    comment.querySelector('like').innerText = 'Descurtir';
    comment.querySelector('like').setAttribute('liked', '');
    comment.querySelector('likes').innerText = likesNumber + 1;
};
const unlikeComment = id => {
    const comment = document.querySelector(`[data-comment-id="${id}"]`);
    const likesNumber = Number(comment.querySelector('likes').innerText);

    comment.querySelector('like').innerText = 'Curtir';
    comment.querySelector('like').removeAttribute('liked');
    comment.querySelector('likes').innerText = likesNumber - 1;
};
const setupComments = () => {
    console.log('loaded');
    const storedLikesComments = localStorage.likedComments || '[]';
    let likedComments = JSON.parse(storedLikesComments);

    likedComments.forEach(id => {
        likeComment(id);
    });

    document.querySelectorAll('like').forEach(like => {
        like.addEventListener('click', function () {
            const liked = this.innerText === 'Curtir';
            const likedId = this.closest('.comment').getAttribute('data-comment-id');
            const likesElement = this.closest('.comment').querySelector('likes');
            const likesNumber = Number(likesElement.innerText);

            if (liked) {
                likeComment(likedId);
                likedComments.push(likedId);
            } else {
                unlikeComment(likedId);
                likedComments = likedComments.filter(id => id !== likedId);
            }

            localStorage.likedComments = JSON.stringify(likedComments);
        });
    });
};

let notificationIndex = 0;
const setupNotifications = () => {
    const notification = document.querySelector('.notification');

    const notificationContent = notificacoes[notificationIndex];

    notification.querySelector('.name').textContent = notificationContent.nome;
    notification.querySelector('.quantity').textContent = notificationContent.quantidade;
    notification.querySelector('.time').textContent = notificationContent.tempo;

    notificationIndex++;

    if (notificationIndex >= notificacoes.length) {
        notificationIndex = 0;
    }

    notification.classList.add('active');

    let hideTimeout = setTimeout(() => {
        notification.classList.remove('active');
    }, 8000);

    notification.querySelector('.close').addEventListener('click', () => {
        notification.classList.remove('active');
        clearTimeout(hideTimeout);
    });

    setTimeout(() => {
        setupNotifications();
    }, 25000);
};

const setupFaq = () => {
    document.querySelectorAll('.question-item').forEach(question => {
        question.addEventListener('click', function () {
            this.classList.toggle('active');
            slideToggle(this.querySelector('.question-item__description'), 200);
        });
    });
};

const setupViewers = () => {
    let minViewers = 589;

    document.querySelector('.viewers b').textContent = localStorage.viewers || minViewers;

    setInterval(() => {
        const viewers = Number(localStorage.viewers || minViewers);
        let newViewers = viewers + Math.floor(Math.random() * 10) - 2;

        if (newViewers <= minViewers) {
            newViewers += Math.floor(Math.random() * 15);
        }

        localStorage.viewers = newViewers;
        document.querySelector('.viewers b').textContent = newViewers;
    }, 5000);
};

document.addEventListener('DOMContentLoaded', () => {
    setupComments();
    setupFaq();
    setupViewers();

    document.querySelector('.viewers span').innerText = new Date().toLocaleDateString();

    document.querySelector('.escolher-meu-kit button').addEventListener('click', () => {
        document.querySelector('.kits').scrollIntoView({ behavior: 'smooth' });
    });

    window.addEventListener('showHiddenElements', () => {
        console.log('showHiddenElements');
        setupNotifications();
    });

    // Adia o carregamento do vídeo
    setTimeout(loadVturb, DELAY_VIDEO * 1000);

    // Adia o carregamento do Google Tag Manager
    if (ATIVAR_GTM) {
        setTimeout(() => {
            (function (w, d, s, l, i) {
                w[l] = w[l] || [];
                w[l].push({ 'gtm.start': new Date().getTime(), 'event': 'gtm.js' });
                var f = d.getElementsByTagName(s)[0],
                    j = d.createElement(s),
                    dl = l != 'dataLayer' ? '&l=' + l : '';
                j.defer = true;
                j.src = '../../www.googletagmanager.com/gtm5445.html?id=' + i + dl;
                f.parentNode.insertBefore(j, f);
            })(window, document, 'script', 'dataLayer', 'GTM-5FFK2Z8Z');
        }, DELAY_GTM * 1000);
    }
});


// Função que só carrega as imagens quando elas estiverem visíveis na tela
const loadImagesInView = () => {
    const className = 'placeholder-loader';
    document.querySelectorAll(`.${className}`).forEach(img => {
        // Verifica se a imagem está no viewport
        const isInView = img.getBoundingClientRect().top < window.innerHeight;

        // Se a imagem não tiver uma largura e altura, ela não está visível (na maioria dos casos)
        const isVisible = img.offsetWidth > 0 && img.offsetHeight > 0;

        // Se a imagem estiver visível, carregamos ela
        if (isInView && isVisible) {
            img.setAttribute('src', img.getAttribute('data-src'));
            img.classList.remove(className);
        }
    });
};

// Adiciona os eventos para carregar as imagens quando for feito scroll, resize e quando a página for carregada
document.addEventListener('scroll', loadImagesInView);
document.addEventListener('resize', loadImagesInView);
document.addEventListener('DOMContentLoaded', loadImagesInView);