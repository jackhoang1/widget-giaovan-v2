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
  background: url("data:image/svg+xml;utf8,<svg fill='black' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")
    no-repeat right #eee !important;
  background-size: 20px;
  appearance: none;
}

* {
  font-size: 13px;
  box-sizing: border-box;
  margin: 0;
  padding: 0;

  input,
  textarea,
  select {
    border: none !important;
    border-radius: 1rem !important;
    padding: 0.25rem 1rem !important;
  }

  hr {
    opacity: 0.5;
    margin: 1rem 0 1rem 0;
  }

  &::-webkit-scrollbar {
    display: none;
  }
}

body {
  margin: 0;
  font-family: var(--bs-font-sans-serif);
  font-size: 1rem;
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

  p {
    font-size: 1.3rem;
    font-weight: bold;
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
  font-size: 0.9rem;
  background: #0d6efd;
  color: #ffffff;
  height: 2rem;
  outline: none;
  border: none;
  border-radius: 1rem;
  -webkit-box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);

  &:hover {
    background: #0167ff;
    transition: transform 0.15s, background 0.15s;
    -webkit-transform: scale(1.03);
    transform: scale(1.03);
    -webkit-box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);
  }
  &:focus {
    background: #0167ff;
    transition: transform 0.15s, background 0.15s;
    -webkit-transform: scale(1.03);
    transform: scale(1.03);
    -webkit-box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);
  }
}

.form-control-sm {
  height: calc(1.5em + 0.5rem + 2px);
  width: 100%;
  padding: 0.25rem 0.5rem;
  color: #000000;
  font-size: 0.875rem;
  line-height: 1.5;
  border-radius: 0.2rem;
  border: none;
  background: #eee;
  background-clip: padding-box;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  option {
    background: #ffffff;
  }

  &:focus {
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);
    background: #eee;
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
    top: 0;
    bottom: auto;
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
  border-radius: 1rem !important;
  border: 1px solid red !important;
}

select {
  @include imageSelect;
}
.switch {
  width: 40px;
  height: 16px;
  box-shadow: 0 0 2px;
  border-radius: 16px;
  background: red;
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
    box-shadow: 0 0 1px;
    background: white;
    padding: 6px;
    transition: transform 0.3s ease-out;
    transform: translateX(0);
  }
  .circle-on {
    transition: transform 0.3s ease-out;
    transform: translateX(24px) !important;
  }
}
.switch-on {
  background: green !important;
}
</style>
