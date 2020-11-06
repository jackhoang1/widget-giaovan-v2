<template>
  <div class>
    <!-- Xác thực App -->

    <!--End Xác thực App -->
    <!-- xác thực app  -->
    <Login
      v-if="isLogin || (!is_oauth && !overlaySign)"
      :isLogin="isLogin"
      :showLogin="showLogin"
      :hideLogin="hideLogin"
      :access_token="access_token"
      :forceRerender="forceRerender"
      :key="componentKey"
      @store-token="store_token = $event"
      @store-email="payload.store_email = $event"
    >
    </Login>
    <div v-if="overlaySign" class="overlay"></div>
    <!-- component giao vận -->
    <div v-if="is_oauth" class="widget">
      <Delivery
        :store_token="store_token"
        :payload="payload"
        :showLogin="showLogin"
        :hideLogin="hideLogin"
        :key="componentKey"
      />
    </div>
  </div>
</template>

<script>
import Restful from "@/services/resful.js";
import Delivery from "@/components/delivery/Delivery.vue";
import Login from "@/components/login/Login.vue";
import { APICMS, ApiBase, secretKey } from "@/services/domain.js";

let urlString = location.href;
let url = new URL(urlString);
let access_token = url.searchParams.get("access_token");

const Toast = Swal.mixin({
  toast: true,
  position: "top",
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: false,
  onOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
  width: "80vw",
});
const Toast2 = Swal.mixin({
  toast: true,
  position: "top",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: false,
  onOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
  width: "80vw",
});

export default {
  components: {
    Delivery,
    Login,
  },
  data() {
    return {
      componentKey: 0,
      isLogin: false,
      is_oauth: false,
      is_warning: false,
      secretKey: secretKey,
      access_token: access_token,
      cms_account: "",
      cms_password: "",

      overlaySign: true,
      show_list_store: false,
      list_store: [],

      store_token: "",
      payload: {
        psid: "",
        fb_page_id: "",
        token_bbh: "",
        name: "",
        phone: "",
        email: "",
        customer_id: "",
        store_email: "",
      },
    };
  },
  async created() {
    await this.partnerAuth();
  },
  methods: {
    forceRerender() {
      this.componentKey += 1;
      this.isLogin = false;
    },
    async partnerAuth() {
      try {
        let body = {
          access_token: this.access_token,
          secret_key: this.secretKey,
        };

        let get_customer_info = await Restful.post(
          `${ApiBase}/v1/service/partner-authenticate`,
          body
        );
        if (
          get_customer_info &&
          get_customer_info.data &&
          get_customer_info.data.data
        ) {
          this.is_oauth = true;
          let customer = get_customer_info.data.data;
          if (customer.public_profile) {
            if (customer.public_profile.token_partner) {
              this.store_token = customer.public_profile.token_partner;
            }
            if (customer.public_profile.client_name) {
              this.payload.name = customer.public_profile.client_name;
            }
            if (customer.public_profile.fb_client_id) {
              this.payload.psid = customer.public_profile.fb_client_id;
            }
            if (customer.public_profile.fb_page_id) {
              this.payload.fb_page_id = customer.public_profile.fb_page_id;
            }
          }
          if (customer.conversation_chatbot) {
            this.payload.token_bbh =
              customer.conversation_chatbot.bbh_public_token;
          }
          if (
            customer.conversation_contact &&
            customer.conversation_contact.client_email
          ) {
            this.payload.email = customer.conversation_contact.client_email;
          }
          if (
            customer.conversation_contact &&
            customer.conversation_contact.client_phone
          ) {
            this.payload.phone = customer.conversation_contact.client_phone
              .split(".")
              .join("")
              .split(" ")
              .join("");
          }
          this.handleLocalStorage();
        }
      } catch (e) {
        // Chạy vào SignIn
        this.overlaySign = false;
        this.is_oauth = false;
        console.log("info err", e);
      }
    },
    showLogin() {
      this.isLogin = true;
    },
    hideLogin() {
      this.isLogin = false;
    },
    handleLocalStorage() {
      let data = JSON.parse(localStorage.getItem("widget_delivery"));
      if (data && data.store_email) {
        this.payload.store_email = data.store_email;
      }
    },
  },
};
</script>

<style lang="scss">
$colorSecond: #140f2d;
$colorAccent110: #f55600;
$colorAccent: #ff5f0b;
$colorAccent70: #ff8f54;
$colorAccent30: #ffcfb6;
$colorAccent10: #fff7f3;
$colorNeutral: #4f596a;
$colorNeutral70: #848b97;
$colorNeutral38: #bcc0c6;
$colorNeutral18: #dfe1e4;
$colorNeutral5: #f6f7f8;
@mixin tooltip-position {
  white-space: nowrap;
  visibility: hidden;
  background-color: #555;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 0.3rem 0.3rem;
  position: absolute;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.3s;
}

@mixin tooltip-position-after {
  content: "";
  position: absolute;
  border-width: 5px;
  border-style: solid;
}

@mixin textDecoration {
  text-align: center;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -70%);
  background: #fff;
  font-size: 1rem;
  color: #777777;
}

@mixin imageSelect {
  background: url(./assets/arrow.svg) no-repeat right #fff !important;
  background-size: 20px;
  appearance: none;
}

* {
  font-size: 14px;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  hr {
    opacity: 0.5;
    margin: 16px 0 16px 0;
  }
  &::-webkit-scrollbar {
    display: none;
  }
}

body {
  margin: 0;
  font-family: var(--bs-font-sans-serif);
  font-weight: 400;
  line-height: 1.5;
  color: #212529;
  background-color: #fff;
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}

/* Auth ---- */
.auth {
  position: absolute;
  padding: 1rem 10%;
  top: 20%;
  width: 100%;
  z-index: 999;

  .auth__activate {
    position: relative;
    background: #ededed;
    border-radius: 4px;
    margin-top: 5%;
    padding: 5% 10%;
    -webkit-box-shadow: 0 0px 10px rgba(0, 0, 0, 0.4);
    box-shadow: 0 0px 10px rgba(0, 0, 0, 0.4);
  }
  .sign {
    width: 100%;
    input {
      width: 100%;
      height: 35px;
      //   background: #eeeeee;
    }
  }

  .select-store {
    width: 100%;
    opacity: 0;
    height: 0;
    transition: all 0.4s ease-out 0.2s;

    .list__store {
      padding: 12px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
      background: #fff;
    }

    .store {
      cursor: pointer;
      padding: 0.5rem 1rem;
      margin: 0.5rem 0;
      color: rgb(24, 24, 24);
      border-radius: 8px;
      background: $colorNeutral5;
      //   box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);
      transition: transform 0.2s ease-out, background 0.7s ease-out;

      &:hover {
        transform: scale(1.03);
        background: $colorNeutral5;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);
      }

      &:active {
        transform: translateY(-3px);
      }
    }

    .store:last-child {
      border-bottom: 2px solid #0001;
    }
  }

  .show-store {
    height: initial;
    opacity: 1;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #fff;
  }
}

/* --------------- */

.auth__warning {
  padding: 0 1.5rem 0 1.5rem;

  .auth__activate {
    position: relative;
    background: #f6f6f6;
    border: 2px solid rgba(0, 0, 0, 0.125);
    border-radius: 10px;
    margin-top: 20%;
    padding: 10% 10% 5% 10%;
  }
}

.all__text--decoration {
  @include textDecoration;
  width: 100px;
}

.all__text--decoration-long {
  @include textDecoration;
  width: 150px;
}

.btn-pill {
  font-size: 12px;
  line-height: 20px;
  background: #ff5f0b;
  color: #ffffff;
  height: 2rem;
  outline: none;
  border: none;
  border-radius: 16px;
  -webkit-box-shadow: 0px 2px 10px rgba(255, 95, 11, 0.3);
  box-shadow: 0px 2px 10px rgba(255, 95, 11, 0.3);
  &:hover {
    background: #ff5f0b;
    transition: transform 0.15s, background 0.15s;
    -webkit-transform: scale(1.03);
    transform: scale(1.03);
    -webkit-box-shadow: 0px 2px 10px rgba(255, 95, 11, 0.3);
    box-shadow: 0px 2px 10px rgba(255, 95, 11, 0.3);
  }
  &:focus {
    background: #ff5f0b;
    transition: transform 0.15s, background 0.15s;
    -webkit-transform: scale(1.03);
    transform: scale(1.03);
    -webkit-box-shadow: 0px 2px 10px rgba(255, 95, 11, 0.3);
    box-shadow: 0px 2px 10px rgba(255, 95, 11, 0.3);
  }
}

.form-control-sm {
  height: 32px;
  width: 100%;
  padding: 4px 12px;
  color: #000000;
  font-size: 14px;
  line-height: 22px;
  border: 1px solid #dfe1e4;
  border-radius: 4px;
  appearance: none;
  background: #fff;
  background-clip: padding-box;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  option {
    background: #ffffff;
  }

  &:focus {
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);
    background: #fff;
    outline: none;
  }
}

.tooltip {
  position: relative;
  display: inline-block;
  &:hover {
    .tooltip-left,
    .tooltip-right,
    .tooltip-top,
    .tooltip-bottom {
      visibility: visible;
      opacity: 1;
    }
  }
  .tooltip-top {
    @include tooltip-position;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);

    &::after {
      @include tooltip-position-after;
      top: 100%;
      left: 50%;
      margin-left: -0.5rem;
      border-color: #555 transparent transparent transparent;
    }
  }
  .tooltip-bottom {
    @include tooltip-position;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);

    &::after {
      @include tooltip-position-after;
      bottom: 100%;
      left: 50%;
      margin-left: -0.5rem;
      border-color: transparent transparent #555 transparent;
    }
  }
  .tooltip-right {
    @include tooltip-position;
    top: 0;
    left: 100%;
    margin-left: -10px;
    &::after {
      @include tooltip-position-after;
      top: 50%;
      right: 100%;
      margin-top: -0.5rem;
      border-color: transparent #555 transparent transparent;
    }
  }
  .tooltip-left {
    @include tooltip-position;
    top: -5px;
    bottom: auto;
    margin-right: 10px;
    right: 100%;
    &::after {
      @include tooltip-position-after;
      top: 50%;
      left: 100%;
      margin-top: -0.5rem;
      border-color: transparent transparent transparent #555;
    }
  }
  img {
    height: 12px;
    width: 12px;
  }
}

.validate-failed {
  border: 1px solid red !important;
}
.validate-failed-address {
  // margin-bottom: 1rem !important;
  padding: 0 !important;
  margin-left: 5px !important;
  margin-right: 5px !important;
  border-radius: 4px !important;
  border: 1px solid red !important;
}

select {
  @include imageSelect;
}
.switch {
  width: 44px;
  height: 22px;
  // box-shadow: 0 0 1px;
  border-radius: 16px;
  background: $colorNeutral5;
  display: flex;
  justify-content: flex-start;
  align-content: center;
  transition: background 0.3s ease-out;
  &:hover {
    cursor: pointer;
  }
  .circle {
    margin: 2px;
    border-radius: 50%;
    box-shadow: 0 0 2px;
    background: $colorNeutral38;
    padding: 9px;
    transition: transform 0.3s ease-out;
    transform: translateX(0);
  }
  .circle-on {
    background: #fff;
    transition: transform 0.3s ease-out;
    transform: translateX(24px) !important;
  }
}
.switch-on {
  background: $colorAccent !important;
}
.text__accent--medium {
  font-size: 14px;
  line-height: 22px;
  color: $colorAccent;
}
.text__second--large {
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  color: $colorSecond;
}
.text__second--medium {
  color: $colorSecond;
  font-size: 14px;
  line-height: 22px;
}
.text__neutral--medium {
  color: $colorNeutral;
  font-size: 14px;
  line-height: 22px;
}
.text__neutral38--medium {
  color: $colorNeutral38;
  font-size: 14px;
  line-height: 22px;
}
.text__neutral70--medium {
  color: $colorNeutral70;
  font-size: 14px;
  line-height: 22px;
}
.text__neutral {
  color: $colorNeutral70;
  font-size: 12px;
  line-height: 20px;
}
.icon__add--cursor {
  cursor: pointer;
  &:hover {
    // transform: scale(1.1);
    border-radius: 50%;
    background: $colorNeutral18;
  }
}
.cursor__pointer {
  cursor: pointer;
}
.padding__left--8 {
  padding-left: 8px;
}
.padding__left--16 {
  padding-left: 16px;
}
.padding__right--18 {
  padding-right: 18px;
}
.padding__right--16 {
  padding-right: 16px;
}
.padding__right--12 {
  padding-right: 12px;
}
.padding__x--16 {
  padding: 0 16px;
}
.margin__left--8 {
  margin-left: 8px;
}
.margin__left--12 {
  margin-left: 12px;
}
.margin__left--20 {
  margin-left: 20px;
}
.margin__right--5 {
  margin-right: 5px;
}
.margin__right--12 {
  margin-right: 12px;
}
.margin__right--18 {
  margin-right: 18px;
}
.margin__bottom--6 {
  margin-bottom: 6px;
}
.margin__bottom--8 {
  margin-bottom: 8px;
}
.margin__bottom--9 {
  margin-bottom: 9px;
}
.margin__bottom--12 {
  margin-bottom: 12px;
}
.margin__bottom--13 {
  margin-bottom: 13px;
}
.margin__bottom--15 {
  margin-bottom: 15px;
}
.margin__bottom--20 {
  margin-bottom: 20px;
}
.font__weight--600 {
  font-weight: 600;
}
.margin__top--20 {
  margin-top: 20px;
}
.margin__top--17 {
  margin-top: 17px;
}
.margin__top--15 {
  margin-top: 15px;
}
.margin__top--11 {
  margin-top: 11px;
}
.margin__top--9 {
  margin-top: 9px;
}
.margin__top--7 {
  margin-top: 7px;
}
.margin__y--8 {
  margin: 8px 0;
}
.margin__y--15 {
  margin: 15px 0;
}
.text__right {
  text-align: right;
}
.text__left {
  text-align: left;
}
.text__decoration--none {
  text-decoration: none;
}
.column-icon-delete {
  -ms-flex: 0 0 8.333333% !important;
  flex: 0 0 8.333333% !important;
  max-width: 8.333333% !important;
}
.column-name-product {
  -ms-flex: 0 0 33.333333% !important;
  flex: 0 0 33.333333% !important;
  max-width: 33.333333% !important;
}
.hover-scale {
  &:hover {
    transform: scale(1.1);
  }
}
.close {
  position: absolute;
  background: $colorNeutral38;
  top: -10px;
  right: -7px;
  opacity: 1;
  border-radius: 50%;
  padding: 7px;
  display: flex;
  justify-content: center;
  align-items: center;
  &:hover {
    cursor: pointer;
    opacity: 1 !important;
    transform: scale(1.1);
  }
  &:focus {
    outline: none;
  }
  img {
    width: 6px;
    height: 6px;
  }
}
input[type="radio"] {
  display: none;
}

input[type="radio"] + label {
  // color:#f2f2f2;
  font-family: Arial, sans-serif;
  font-size: 14px;
}

input[type="radio"] + label span {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin: -1px 12px 0 0;
  vertical-align: middle;
  background: url(./assets/radio.svg) no-repeat;
  cursor: pointer;
}

input[type="radio"]:checked + label span {
  background: url(./assets/radio_checked.svg) no-repeat;
}

input[type="checkbox"] {
  display: none;
}

input[type="checkbox"] + label {
  // color:#f2f2f2;
  font-family: Arial, sans-serif;
  font-size: 14px;
}

input[type="checkbox"] + label span {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin: 1px 8px 0 0;
  vertical-align: middle;
  background: url(./assets/checkbox.svg) no-repeat;
  cursor: pointer;
}

input[type="checkbox"]:checked + label span {
  background: url(./assets/checkbox_checked.svg) no-repeat;
}
</style>
