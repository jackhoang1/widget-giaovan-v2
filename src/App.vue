<template>
  <div class>
    <!-- Xác thực App -->
    <div v-if="!is_oauth" class="auth">
      <div class="auth__activate" v-if="!show_list_store">
        <div class="sign d-flex flex-column align-items-center">
          <p class="text-dark mb-4">Đăng Nhập CMS</p>
          <input
            v-model="cms_account"
            type="text"
            class="form-control mb-3"
            placeholder="Email"
          />
          <input
            v-model="cms_password"
            type="password"
            class="form-control mb-3"
            placeholder="Password"
          />
          <button class="btn btn-primary text-light" v-on:click="runSignIn()">
            Sign In
          </button>
        </div>
      </div>
      <div :class="['select-store', 'mb-5', { 'show-store': show_list_store }]">
        <div class="list__store" v-if="show_list_store">
          <p class="text-center mb-4">Danh sách Store</p>
          <div
            v-for="(item, ind) in list_store"
            class="store"
            @click="handleChooseStore(item)"
            :key="ind"
          >
            {{ item.store_name }}
          </div>
        </div>
      </div>
      <div v-if="overlaySign" class="overlay"></div>
    </div>
    <!--End Xác thực App -->

    <div v-if="is_oauth && !is_warning" class="widget">
      <Delivery :store_token="store_token" :payload="payload" />
    </div>
    <!-- warning -->
    <div v-if="is_oauth && is_warning" class="auth__warning">
      <div class="auth__activate">
        <div class="text-center">
          <img src="@/assets/error.png" alt />
        </div>
        <p class="mb-0">Xin vui lòng kích hoạt lại ứng dụng</p>
      </div>
    </div>
  </div>
</template>

<script>
import Restful from "@/services/resful.js";
import Delivery from "@/components/delivery/Delivery.vue";
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
  },
  data() {
    return {
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
      } catch (error) {
        // Chạy vào SignIn
        this.overlaySign = false;
        this.is_oauth = false;
        console.log("info err", error);
      }
    },
    async runSignIn() {
      try {
        // Call Api Đăng nhập CMS
        let path = "https://api.botup.io/v1/auth/sign-in";
        let body = {
          email: this.cms_account,
          password: this.cms_password,
        };

        let sign_in = await Restful.post(path, body);

        let user = {};
        if (sign_in.data && sign_in.data.data && sign_in.data.data.user) {
          user = sign_in.data.data.user;
        } else {
          throw "Đăng nhập thất bại";
        }
        let { email, first_name, last_name, id, role } = user;
        path = `${APICMS}/v1/users/users/singinbotup`;
        body = {
          username: id,
          email,
          first_name,
          last_name,
          role,
        };

        // Call Api Đăng nhập Botup
        let cms_signin = await Restful.post(path, body);

        // Lấy danh sách Store
        path = `${APICMS}/v1/selling-page/store/store_read`;
        let params = {};
        if (
          cms_signin.data &&
          cms_signin.data.data &&
          cms_signin.data.data.user &&
          cms_signin.data.data.user.id
        ) {
          params = {
            owner_id: cms_signin.data.data.user.id,
          };
        } else {
          throw "Đăng nhập thất bại";
        }

        let read_store = await Restful.get(path, params);

        if (read_store.data && read_store.data.data) {
          this.list_store = read_store.data.data;
          this.show_list_store = true;
        } else {
          throw "Lỗi khi lấy danh sách Store";
        }
      } catch (e) {
        console.log("error", e);
        if (e.data.message) {
          Toast2.fire({
            icon: "error",
            title: e.data.message,
          });
          return;
        }
        Toast2.fire({
          icon: "error",
          title: e,
        });
      }
    },
    handleLocalStorage() {
      let data = JSON.parse(localStorage.getItem("widget_delivery"));
      if (data && data.store_email) {
        this.payload.store_email = data.store_email;
      }
    },
    handleChooseStore(item) {
      this.store_token = item.access_token;
      localStorage.removeItem("widget_delivery");
      let data = {};
      if (item.store_email) {
        this.payload.store_email = item.store_email;
        data["store_email"] = item.store_email;
      }
      localStorage.setItem("widget_delivery", JSON.stringify(data));
      this.runOAuth();
    },
    async runOAuth() {
      try {
        // Call Api xác thực khi chọn Store và lưu lại Token
        let body = {
          _type: "oauth-access-token",
          access_token: this.access_token,
          token_partner: this.store_token,
        };
        // Xác thực Widget
        let oauth = await Restful.post(
          `${ApiBase}/v1/app/app-installed/update`,
          body
        );
        Toast2.fire({
          icon: "success",
          title: "Xác thực thành công",
        });
        setTimeout(() => {
          window.close();
        }, 1000);
      } catch (e) {
        console.log(e);
        if (
          e.data &&
          e.data.message &&
          e.data.message.message == "jwt expired"
        ) {
          return Toast2.fire({
            icon: "error",
            title: "Vui lòng tải lại trang và kích hoạt lại!",
          });
        }
        Toast2.fire({
          icon: "error",
          title: "Xác thực không thành công",
        });
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
  background: url(./assets/arrow.svg)
    no-repeat right #fff !important;
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
  top: 12%;
  width: 100%;
  z-index: 999;

  .auth__activate {
    position: relative;
    background: #ededed;
    border-radius: 1rem;
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

    button {
      font-weight: bold;
      box-shadow: 0 5px 15px 0 #007bff30;
      transition: all 0.5s;
      border-radius: 25px;
      padding: 0.5rem 3.5rem;
      margin-top: 1.5rem;

      &:hover {
        background: #007bff;
        box-shadow: 0 5px 20px 0 #007bff30;
      }

      &:focus {
        box-shadow: 0 5px 20px 0 #007bff30 !important;
        background: #007bff !important;
      }
    }
  }

  .select-store {
    width: 100%;
    opacity: 0;
    height: 0;
    transition: all 0.4s ease-out 0.2s;

    .list__store {
      padding: 1rem;
      border-radius: 1rem;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
    }

    .store {
      cursor: pointer;
      text-align: center;
      padding: 0.5rem 1rem;
      margin: 0.5rem 0;
      color: rgb(24, 24, 24);
      border-radius: 1rem;
      font-weight: bold;
      background: #ededed;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);
      transition: transform 0.2s ease-out, background 0.7s ease-out;

      &:hover {
        transform: scale(1.03);
        background: #ed5a29;
        color: #fff;
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
</style>
