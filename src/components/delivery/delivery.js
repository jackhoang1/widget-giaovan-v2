import EventBus from "@/EventBus.js";
import Restful from "@/services/resful.js"
import SearchAddress from "@/components/SearchAddress.vue"
import InfoOrder from "@/components/infoOrder/InfoOrder.vue"
import Login from "@/components/login/Login.vue"

// const APICMS = "https://ext.botup.io" //product
// const APICMS = "http://localhost:1337" //dev
const APICMS = "https://devbbh.tk"; //dev


export default {
    components: { SearchAddress, InfoOrder, Login },
    props: ['store_token', 'payload', 'showLogin', 'hideLogin'],
    data() {
        return {
            delivery_platform: "",
            list_inventories: "",
            pack_service_list: "",
            country: "",
            list_province: "",
            list_district_receiver: "",
            list_ward_receiver: "",
            pricing_services_list: "",
            list_order_payment_vtp: [{ name: 'Chưa thanh toán/Do not collect money', value: 1 }, { name: 'Thu phí ship và giá sản phẩm/Collect ship fee and price of products', value: 2 }, { name: 'Thu giá sản phẩm/Collect price of products', value: 3 }, { name: 'Thu phí ship/Collect ship fee', value: 4 }],
            list_order_payment_ghn: [{ name: 'Người gửi trả tiền', value: 1 }, { name: 'Người nhận trả tiền', value: 2 }],
            list_order_payment_ghtk: [{ name: 'Người nhận trả tiền', value: 0 }, { name: 'Người gửi trả tiền', value: 1 }],
            product: {
                name: "",
                weight: 0,
                quantity: 1,
            },
            list_product_name: "",
            product_total_item: 0,
            list_product: [],
            product_price: 0,
            product_price_num: 0,
            order_info: {
                order_id: "",
                inventory: "",
                group_address_id: "",
                country: "Việt Nam",
                sender_name: "",
                sender_phone: "",
                sender_email: this.payload.store_email,
                sender_street: "",
                sender_address: "",
                sender_ward: "",
                sender_district: "",
                sender_province: "",

                receiver_name: this.payload.name,
                receiver_phone: this.payload.phone,
                receiver_email: this.payload.email,
                receiver_street: "",
                receiver_address: "",
                receiver_ward: "",
                receiver_district: "",
                receiver_province: "",
                weight: 500,
                length: 20,
                width: 20,
                height: 20,
                product_type: "",
                order_payment: "",
                order_service: "",
                required_note: "",
                cod_amount: 0,
                cod_amount_num: 0,
                shipping_fee: 0,
                coupon: "",
                other_info: {
                    // pick_date: "2020-09-03",
                    is_freeship: "",
                    transport: "",
                },
                note: "",
            },
            validate_failed: {
                order_id: false,
                inventory: false,
                country: false,
                sender_email: false,
                receiver_name: false,
                receiver_phone: false,
                receiver_street: false,
                receiver_email: false,
                receiver_province: false,
                receiver_district: false,
                receiver_ward: false,
                code_amount: false,
                product_price: false,
                order_payment: false,
                order_service: false,
                weight: false,
                order_service: false,
                length: false,
                width: false,
                height: false,
                product_type: false,
                required_note: false,
                coupon_real_ghn: false,
                other_info: {
                    transport: false,
                },
                order_value_num: false,
                list_product: false,
            },
            timer: "",
            coupon_real_ghn: true,
            option_save_info: true,
            handle_api: false,
            is_show_popup: false,
            is_show_note: false,
            is_show_order_info: false,
            is_loading: false,
            switch_order_id: true,
            showSetting: false,
            showSettingContent: true,
        };
    },
    async created() {
        console.log('create delivery run');
        this.readSwitchLocal
        EventBus.$on("show-modal-setting", () => {
            this.showFormLogin()
        });
        EventBus.$on("hide-modal-setting", () => {
            this.hideFormLogin()
        });
    },
    async mounted() {
        await this.getInventory()
        this.getListProvince()
        this.getEmailLocal()
        this.initialization
        this.handleCreateOrderId()
    },
    computed: {
        initialization() {   //default mã ghi chú bắt buộc(GHN), hình thức thanh toán , phân loại sản phẩm(VTP)
            if (this.delivery_platform == 'VIETTEL_POST') {
                this.order_info.product_type = 'HH'
                this.order_info.order_payment = this.list_order_payment_vtp[0]
            }
            if (this.delivery_platform == 'GHN') {
                this.order_info.required_note = 'KHONGCHOXEMHANG'
                this.order_info.order_payment = this.list_order_payment_ghn[1]
            }
            if (this.delivery_platform == 'GHTK') {
                this.order_info.order_payment = this.list_order_payment_ghtk[0]
                this.order_info.other_info.transport = 'road'
            }
        },
        readSwitchLocal() {
            let switch_order_id = JSON.parse(localStorage.getItem('widget_delivery_switch_order_id'))
            console.log('switch_order_id', typeof switch_order_id);
            if (switch_order_id) {
                return this.switch_order_id = true
            }
            this.switch_order_id = false
        },
    },
    methods: {
        async getListProvince() {
            try {
                let path = `${APICMS}/v1/selling-page/locations/provinces_v2`
                let headers = { 'Authorization': this.store_token }

                let get_list_province = await Restful.get(path, null, headers)

                if (get_list_province.data && get_list_province.data.data) {
                    this.list_province = get_list_province.data.data
                }
            } catch (e) {
                console.log(e)
            }
        },
        async getListDistrict() {
            try {
                let path = `${APICMS}/v1/selling-page/locations/districts_v2`
                let params = { 'province_id': this.order_info.receiver_province.province_id }
                let headers = { 'Authorization': this.store_token }

                let get_list_district = await Restful.get(path, params, headers)

                if (get_list_district.data && get_list_district.data.data) {
                    this.list_district_receiver = get_list_district.data.data
                }
            } catch (e) {
                console.log("error", e)
            }
        },
        async getListWard() {
            try {
                let path = `${APICMS}/v1/selling-page/locations/wards_v2`
                let params = { 'district_id': this.order_info.receiver_district.district_id }
                let headers = { 'Authorization': this.store_token }

                let get_list_ward = await Restful.get(path, params, headers)

                if (get_list_ward.data && get_list_ward.data.data) {
                    this.list_ward_receiver = get_list_ward.data.data
                }
            } catch (e) {
                console.log("error", e)
            }
        },
        resetChangeCity() {
            this.district = ""
            this.ward = ""
        },
        resetChangeDistrict() {
            this.ward = ""
        },
        async getInventory() {
            try {
                let path = `${APICMS}/v1/selling-page/delivery/delivery_inventory`
                let headers = {
                    Authorization: this.store_token
                }

                let get_inventory = await Restful.get(path, null, headers)

                if (
                    get_inventory.data &&
                    get_inventory.data.data
                ) {
                    this.delivery_platform = get_inventory.data.data.platform_type
                    let list_inventories = get_inventory.data.data.inventory || get_inventory.data.data.shops || get_inventory.data.data.data
                    if (list_inventories && list_inventories.length > 0) {
                        this.list_inventories = list_inventories
                        this.order_info.inventory = this.list_inventories[0] // mặc định kho hàng đầu tiên
                    }
                }
            } catch (e) {
                console.log(e)
                this.swalToast('Lỗi khi lấy kho hàng', 'error')
            }
        },
        async getPricingServices() {
            try {
                let body = {}
                if (this.delivery_platform == 'VIETTEL_POST') {
                    if (!this.order_info.inventory.provinceId ||
                        !this.order_info.inventory.districtId ||
                        !this.order_info.receiver_province ||
                        !this.order_info.receiver_district ||
                        !this.order_info.product_type ||
                        !this.order_info.weight ||
                        !this.order_info.length ||
                        !this.order_info.width ||
                        !this.order_info.height ||
                        !this.product_price_num) return
                    body = {
                        "sender_province": this.order_info.inventory.provinceId,
                        "sender_district": this.order_info.inventory.districtId,
                        "receiver_province": this.order_info.receiver_province.province_id,
                        "receiver_district": this.order_info.receiver_district.district_id,
                        "product_type": this.order_info.product_type,
                        "weight": parseInt(this.order_info.weight),
                        "length": parseInt(this.order_info.length),
                        "width": parseInt(this.order_info.width),
                        "height": parseInt(this.order_info.height),
                        "product_price": parseInt(this.product_price_num),
                    }
                }
                if (this.delivery_platform == 'GHN') {
                    if (!this.order_info.inventory.district_id ||
                        !this.order_info.receiver_district) return
                    body = {
                        "shop_id": this.order_info.inventory._id,
                        "from_district": this.order_info.inventory.district_id,
                        "to_district": this.order_info.receiver_district.meta_data.ghn.district_id,
                    }
                }
                if (this.delivery_platform == 'GHTK') { return }
                let path = `${APICMS}/v1/selling-page/delivery/delivery_get_service`
                let headers = {
                    Authorization: this.store_token
                }

                let get_pricing_services = await Restful.post(path, body, null, headers)

                if (
                    get_pricing_services.data &&
                    get_pricing_services.data.data &&
                    get_pricing_services.data.code == 200
                ) {
                    let services = get_pricing_services.data.data.services
                    this.order_info.order_service = ""
                    this.order_info.shipping_fee = 0
                    this.pricing_services_list = services
                    if (services && services.length > 0) {
                        this.order_info.order_service = services[0]   //default dịch vụ 1
                    }
                }
            } catch (e) {
                console.log(e)
            }
        },
        async getShippingFee() {
            try {
                if (this.delivery_platform == "VIETTEL_POST") return
                let body = {}
                if (this.delivery_platform == "GHN") {
                    if (!this.order_info.inventory ||
                        !this.order_info.order_service ||
                        !this.order_info.receiver_district ||
                        !this.order_info.receiver_ward ||
                        !this.order_info.weight ||
                        !this.order_info.height ||
                        !this.order_info.length ||
                        !this.order_info.width
                    ) return
                    body = {
                        "shop_id": this.order_info.inventory._id,
                        "service_id": this.order_info.order_service.service_id,
                        "coupon": this.order_info.coupon,
                        "district_id": this.order_info.receiver_district.meta_data.ghn.district_id,
                        "ward_code": this.order_info.receiver_ward.meta_data.ghn.code,
                        "height": parseInt(this.order_info.height),
                        "length": parseInt(this.order_info.length),
                        "weight": parseInt(this.order_info.weight),
                        "width": parseInt(this.order_info.width),
                    }
                }
                if (this.delivery_platform == "GHTK") {
                    if (!this.order_info.receiver_street
                        || !this.order_info.receiver_district
                        || !this.order_info.receiver_province
                        || this.list_product.length == 0
                        || !this.product_price_num
                        || !this.order_info.other_info.transport
                    ) return
                    this.order_info.receiver_address = `${this.order_info.receiver_street}, ${this.order_info.receiver_ward.name}, ${this.order_info.receiver_district.name}, ${this.order_info.receiver_province.name}`
                    this.list_product.forEach(product => {
                        this.order_info.weight += product.weight
                        console.log('111111111111111111', this.order_info.weight, product.weight);
                    });

                    body = {
                        "receiver_province": this.order_info.receiver_province.name,
                        "receiver_district": this.order_info.receiver_district.name,
                        "receiver_address": this.order_info.receiver_address,
                        "weight": this.order_info.weight,  // khối lượng tính theo kg
                        "value": this.product_price_num,
                        "transport": this.order_info.other_info.transport
                    }
                }
                let path = `${APICMS}/v1/selling-page/delivery/delivery_ship_fee`
                let headers = { Authorization: this.store_token }

                let get_shipping_fee = await Restful.post(path, body, null, headers)

                if (
                    get_shipping_fee.data &&
                    get_shipping_fee.data.data &&
                    get_shipping_fee.data.data.data
                ) {
                    this.coupon_real_ghn = true
                    this.order_info.shipping_fee = 0
                    return this.order_info.shipping_fee = get_shipping_fee.data.data.data.total || get_shipping_fee.data.data.data.fee     //GHN||GHTK
                }
                this.order_info.shipping_fee = 0
            } catch (e) {
                console.log(e);
                if (
                    e.data &&
                    e.data.error_message &&
                    e.data.error_message.code_message_value
                ) {
                    this.coupon_real_ghn = false
                    this.swalToast(e.data.error_message.code_message_value, 'error')
                }
                this.order_info.shipping_fee = 0
            }
        },
        handleAddProduct() {
            if (!this.product.name.trim()) {
                return this.swalToast('Bạn chưa nhập tên hàng hoá', 'warning')
            }
            if (this.delivery_platform == 'GHTK' && this.product.weight <= 0) {
                return this.swalToast('Bạn chưa nhập khối lượng lượng sản phẩm (gram)', 'warning')
            }
            if (this.product.quantity <= 0) {
                return this.swalToast('Bạn chưa nhập số lượng sản phẩm', 'warning')
            }
            let product = { name: this.product.name, weight: Number(this.product.weight / 1000), quantity: Number(this.product.quantity) }
            if (this.delivery_platform != 'GHTK') delete product['weight']
            this.list_product.push(product)
            this.product.name = ''
            this.product.weight = 0
            this.product.quantity = 1
        },
        handleDelProduct(ind) {
            let arr = this.list_product.filter((element, index) => {
                return ind != index
            })
            this.list_product = arr
        },
        plusProduct() {
            this.product.quantity++
        },
        minusProduct() {
            if (this.product.quantity > 1)
                this.product.quantity--
        },
        //handle change btn select//
        async handleShopChange() {
            await this.getPricingServices()
            this.getShippingFee()
        },
        handleChangeCity() {
            if (this.delivery_platform == "VIETTEL_POST") {
                this.getPricingServices()
            }
            if (this.delivery_platform == "GHTK") {
                this.getShippingFee()
            }
        },
        handleChangeDistrict() {
            if (this.delivery_platform == "VIETTEL_POST") {
                this.getPricingServices()
            }
            if (this.delivery_platform == "GHTK") {
                this.getShippingFee()
            }
            if (this.delivery_platform == "GHN") {
                this.handleShopChange()
            }
        },
        handleChangeWard() {
            if (this.delivery_platform == "GHN") {
                this.getShippingFee()
            }
        },
        handleChangeSize() {
            if (this.delivery_platform == "VIETTEL_POST") {
                this.getPricingServices()
            }
            if (this.delivery_platform == "GHN") {
                this.getShippingFee()
            }
        },
        handleChangeWeight() {
            if (this.delivery_platform == "VIETTEL_POST") {
                this.getPricingServices()
            }
            if (this.delivery_platform == "GHN" || this.delivery_platform == "GHTK") {
                this.getShippingFee()
            }
        },
        handleChangePrice() {
            if (this.delivery_platform == 'GHTK') {
                this.getShippingFee()
            }
            if (this.delivery_platform == 'VIETTEL_POST') {
                this.getPricingServices()
            }
        },
        /////////////////////////
        handleShippingFeeVTP() {
            if (this.order_info.order_service) {
                this.order_info.shipping_fee = this.order_info.order_service.GIA_CUOC
            }
            else {
                this.order_info.shipping_fee = 0
            }
            this.$emit('shipping_fee', this.order_info.shipping_fee)
            console.log('emit', this.order_info.shipping_fee);
        },
        handleWeightTimeout() {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.timer = setTimeout(() => {
                this.order_info.shipping_fee = 0
                this.handleChangeWeight()
            }, 1000);
        },
        handleSizeTimeout() {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.timer = setTimeout(() => {
                this.handleChangeSize()
            }, 1000);
        },
        handlePriceTimeout() {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.timer = setTimeout(() => {
                this.handleChangePrice()
            }, 1000);
        },
        handleAddress() {
            if (this.delivery_platform == 'VIETTEL_POST') {
                this.order_info.receiver_address = `${this.order_info.receiver_street}, ${this.order_info.receiver_ward.name}, ${this.order_info.receiver_district.name}, ${this.order_info.receiver_province.name}`
            }
            if (this.delivery_platform == 'GHN') {
                this.order_info.receiver_address = `${this.order_info.receiver_street}, ${this.order_info.receiver_ward.meta_data.ghn.name}, ${this.order_info.receiver_district.meta_data.ghn.name}, ${this.order_info.receiver_province.name}`
            }
        },
        infoDelivery() {
            this.list_product_name = ""
            this.product_total_item = 0
            this.list_product.forEach(product => {
                this.list_product_name += `${product.quantity} ${product.name},`
                this.product_total_item += product.quantity
            })
            let other = {}
            let body = {
                "require_order": true,
                "sender_name": this.order_info.inventory.name,
                "sender_address": this.order_info.inventory.address,
                "sender_phone": this.order_info.inventory.phone,
                "sender_ward": this.order_info.inventory.wardsId,
                "sender_district": this.order_info.inventory.districtId,
                "sender_province": this.order_info.inventory.provinceId,
                "receiver_name": this.order_info.receiver_name,
                "receiver_phone": this.order_info.receiver_phone,
                "receiver_address": this.order_info.receiver_address,
                "product_name": this.list_product_name,
                "product_quantity": this.product_total_item,
                "product_price": parseInt(this.product_price_num),
                "product_type": this.order_info.product_type,
                "weight": parseInt(this.order_info.weight),
                "length": parseInt(this.order_info.length),
                "width": parseInt(this.order_info.width),
                "height": parseInt(this.order_info.height),
                "required_note": this.order_info.note,
            }
            if (this.delivery_platform == "VIETTEL_POST") {
                other = {
                    "sender_email": this.order_info.sender_email,
                    "group_address_id": this.order_info.inventory.groupaddressId,
                    "receiver_province": this.order_info.receiver_province.province_id,
                    "receiver_district": this.order_info.receiver_district.district_id,
                    "receiver_ward": this.order_info.receiver_ward.ward_id,
                    "receiver_email": this.order_info.receiver_email,
                    "order_payment": this.order_info.order_payment.value,
                    "order_service": this.order_info.order_service.MA_DV_CHINH
                }
            }
            if (this.delivery_platform == "GHN") {
                delete body["sender_ward"]
                delete body["sender_district"]
                delete body["required_note"]
                other = {
                    "sender_ward": this.order_info.inventory.ward_code,
                    "sender_district": this.order_info.inventory.district_id,
                    "receiver_province": this.order_info.receiver_province.meta_data.ghn.province_id,
                    "receiver_district": this.order_info.receiver_district.meta_data.ghn.district_id,
                    "receiver_ward": this.order_info.receiver_ward.meta_data.ghn.code,
                    "code_amount": this.order_info.code_amount_num,
                    "shop_id": this.order_info.inventory._id,
                    "content": `${this.list_product_name} [Tổng số lượng ${this.product_total_item}]`,
                    "required_note": this.order_info.required_note,
                    "service_type_id": this.order_info.order_service.service_type_id,
                    "payment_type_id": this.order_info.order_payment.value,
                    "order_value": Number(this.product_price_num)
                }
                if (this.coupon_real_ghn) {
                    other["coupon"] = this.order_info.coupon
                }
            }
            if (this.delivery_platform == "GHTK") {
                delete body["length"]
                delete body["width"]
                delete body["height"]
                delete body["weight"]
                delete body["product_name"]
                delete body["product_quantity"]
                delete body["product_price"]
                other = {
                    "order_id": this.order_info.order_id,
                    "products": this.list_product,
                    "receiver_province": this.order_info.receiver_province.name,
                    "receiver_district": this.order_info.receiver_district.name,
                    "receiver_ward": this.order_info.receiver_ward.name,
                    "code_amount": this.order_info.code_amount_num,
                    "order_value": this.product_price_num,
                    "cod_amount": parseInt(this.order_info.cod_amount_num),
                    "other_info": {
                        "transport": this.order_info.other_info.transport,
                        "is_freeship": this.order_info.order_payment.value
                    }
                }
            }
            let info_delivery = { ...body, ...other }
            return info_delivery
        },
        validatePhone(phone) {
            let is_phone = phone.match(/^[0]{1}?[1-9]{1}?[0-9]{8}$/im) || phone.match(/^[\+]?[8]{1}?[4]{1}?[0-9]{9}$/im)
            if (is_phone) {
                return true
            }
            this.validate_failed.receiver_phone = !is_phone ? true : false
            this.swalToast('Số điện thoại không hợp lệ', 'error')
        },
        validateEmail(email) {
            let reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
            let is_email = reg.test(email)
            if (!is_email) {
                this.swalToast('Email không hợp lệ!', 'error')
            }
            return is_email
        },
        validateEmailReceiver(email) {
            let is_email = this.validateEmail(email)
            if (!is_email)
                this.validate_failed.receiver_email = !is_email ? true : false
            return is_email
        },
        validateEmailSender(email) {
            let is_email = this.validateEmail(email)
            if (!is_email)
                this.validate_failed.sender_email = !is_email ? true : false
            return is_email
        },
        changeClassValidate() {
            this.validate_failed.inventory = !this.order_info.inventory ? true : false
            this.validate_failed.receiver_name = !this.order_info.receiver_name ? true : false
            this.validate_failed.receiver_phone = !this.order_info.receiver_phone ? true : false
            this.validate_failed.receiver_street = !this.order_info.receiver_street ? true : false
            this.validate_failed.receiver_email = !this.order_info.receiver_email ? true : false
            this.validate_failed.receiver_province = !this.order_info.receiver_province ? true : false
            this.validate_failed.receiver_district = !this.order_info.receiver_district ? true : false
            this.validate_failed.receiver_ward = !this.order_info.receiver_ward ? true : false
            this.validate_failed.product_price = !this.product_price_num ? true : false
            this.validate_failed.order_payment = !this.order_info.order_payment ? true : false
            this.validate_failed.weight = !this.order_info.weight ? true : false
            this.validate_failed.list_product = !this.list_product.length ? true : false
            if (this.delivery_platform == 'VIETTEL_POST' || this.delivery_platform == 'GHN') {
                this.validate_failed.order_service = !this.order_info.order_service ? true : false
                this.validate_failed.length = !this.order_info.length || this.order_info["length"] < 0 ? true : false
                this.validate_failed.width = !this.order_info.width || this.order_info["width"] < 0 ? true : false
                this.validate_failed.height = !this.order_info.height || this.order_info["height"] < 0 ? true : false
            }
            if (this.delivery_platform == 'VIETTEL_POST') {
                this.validate_failed.product_type = !this.order_info.product_type ? true : false
                this.validate_failed.sender_email = !this.order_info.sender_email ? true : false
            }
            if (this.delivery_platform == 'GHN') {
                this.validate_failed.required_note = !this.order_info.required_note ? true : false
                this.validate_failed.coupon_real_ghn = !this.coupon_real_ghn ? true : false
            }
            if (this.delivery_platform == 'GHTK') {
                this.validate_failed.order_id = !this.order_info.order_id ? true : false
                this.validate_failed.other_info.transport = !this.order_info.other_info.transport ? true : false
                this.validate_failed.weight = !this.order_info.weight || this.order_info.weight / 1000 > 20 ? true : false
                this.validate_failed.order_value_num = !this.order_info.order_value_num || this.order_info.order_value_num >= 20000000 ? true : false
            }
        },
        validateCreateDelivery() {
            console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaa');
            this.changeClassValidate()
            if (
                !this.order_info.inventory ||
                !this.order_info.receiver_name ||
                !this.order_info.receiver_phone ||
                !this.order_info.receiver_street ||
                !this.order_info.receiver_email ||
                !this.order_info.receiver_province ||
                !this.order_info.receiver_district ||
                !this.order_info.receiver_ward ||
                !this.product_price_num ||
                !this.order_info.order_payment ||
                !this.order_info.weight
            ) { return false }
            console.log('bbbbbbbbbbbbbbbb');
            if (this.list_product.length == 0) {
                this.swalToast('Hãy thêm hàng hoá giao vận', 'warning')
                return 'failed'
            }
            if (!this.validatePhone(this.order_info.receiver_phone)) { return 'failed' }
            if (!this.validateEmailReceiver(this.order_info.receiver_email)) { return 'failed' }
            console.log('ccccccccccccccccccccccc');
            if (this.delivery_platform == 'VIETTEL_POST' || this.delivery_platform == 'GHN') {
                if (!this.order_info['order_service'] || this.order_info['length'] <= 0 || this.order_info['width'] <= 0 || this.order_info['height'] <= 0) { return false }
            }
            if (this.delivery_platform == 'VIETTEL_POST') {
                console.log('2222222222222');
                if (!this.order_info.product_type || !this.order_info.sender_email) {
                    return false
                }
                console.log('3333333333333333');
                if (!this.validateEmailSender(this.order_info.sender_email)) { return 'failed' }
            }
            if (this.delivery_platform == 'GHN') {
                if (!this.order_info.required_note || !this.coupon_real_ghn == true) { return false }
            }
            if (this.delivery_platform == 'GHTK') {
                if (!this.order_info.other_info.transport || !this.order_info.order_id) {
                    return false
                }
                if (this.order_info.weight / 1000 > 20) {
                    this.swalToast('Khối lượng tổng đơn hàng không quá 20kg', 'warning')
                    return 'failed'
                }
                if (this.order_info.order_value_num >= 20000000) {
                    this.swalToast('Giá trị đơn hàng để tính phí bảo hiểm không quá 20.000.000đ', 'warning')
                    return 'failed'
                }
            }
            return true
        },
        async createDelivery() {
            try {
                let check = this.validateCreateDelivery()
                if (check == 'failed') return
                if (!check) {
                    return this.swalToast('Vui lòng điền đầy đủ thông tin', 'warning')
                }
                this.is_loading = true
                let path = `${APICMS}/v1/selling-page/delivery/delivery_create`
                let headers = { Authorization: this.store_token }
                let info_delivery = this.infoDelivery()
                let body = {
                    ...info_delivery
                }
                console.log("body create delivery", body)

                let create_order = await Restful.post(path, body, {}, headers)

                if (
                    create_order.data &&
                    create_order.data.data &&
                    create_order.data.data.snap_order
                ) {
                    if ((create_order.data.data.snap_order.data && create_order.data.data.snap_order.data.fee) || create_order.data.data.snap_order.data || create_order.data.data.snap_order.success) {
                        let delivery_id = ''
                        let time = create_order.data.data.updatedAt
                        if (this.delivery_platform == "GHTK") {
                            delivery_id = create_order.data.data.snap_order.order.label
                        }
                        else {
                            delivery_id = create_order.data.data.snap_order.data.order_code || create_order.data.data.snap_order.data.ORDER_NUMBER         //GHN || VTP 
                        }
                        this.sendMessage(delivery_id)
                        this.swalToast("Tạo đơn giao vận thành công", "success")
                        this.handleHideOrderInfo()
                        this.list_product = []
                    }
                    if (
                        !create_order.data.data.snap_order.success &&
                        this.delivery_platform == "GHTK"
                    ) {
                        this.swalToast(create_order.data.data.snap_order.message, "error", 4000)
                    }
                }
                this.is_loading = false
            } catch (e) {
                console.log("e", e)
                this.is_loading = false
                if (
                    e.data &&
                    e.data.error_message
                ) {
                    if (e.data.error_message.code_message_value) {
                        return this.swalToast(e.data.error_message.code_message_value, 'error') //GHN
                    }
                    this.swalToast(e.data.error_message, 'error')   //VTP
                }

            }
        },
        async sendMessage(delivery_id) {
            try {
                // let msg_sample = this.covertMsgContent(order_id, delivery_id, this.payload.payment_platform);
                let messages = [
                    {
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "template_type": "button",
                                "text": `Đơn hàng được giao vận với ${this.delivery_platform}, mã giao vận ${delivery_id}. Để kiểm tra tình trạng giao vận, ấn nút "Kiểm tra vận đơn" bên dưới`,
                                "buttons": [
                                    {
                                        "type": "web_url",
                                        "url": `https://devbbh.tk/dev-cms/#/deliver/?access_token=${this.store_token}&order_id=${delivery_id}`,
                                        "title": "Kiểm tra vận đơn"
                                    }
                                ]
                            }
                        }
                    }
                ]
                let body = { messages }
                let path = `https://api.botbanhang.vn/v1.3/public/json`
                let params = {
                    access_token: this.payload.token_bbh,
                    psid: this.payload.psid,
                }

                let sent_message = await Restful.post(path, body, params)

            } catch (e) {
                console.log("error send mess", e)
                this.swalToast("Lỗi khi gửi tin về message", "error")
            }
        },
        handleCreateOrderId() {
            let num = Math.floor(Math.random() * 1000000)
            let id = `DH${num}`
            return this.order_info.order_id = id
        },
        handleSaveInfo() {
            let data = JSON.parse(localStorage.getItem('widget_delivery'))
            localStorage.setItem('widget_delivery', JSON.stringify({ ...data, 'option_save_info': this.option_save_info, 'sender_email': this.order_info.sender_email }))
        },
        getEmailLocal() {
            if (this.delivery_platform == "VIETTEL_POST") {
                let data = JSON.parse(localStorage.getItem('widget_delivery'))
                if (data && data.option_save_info) {
                    return this.order_info.sender_email = data.sender_email
                }
                this.option_save_info = false
            }

        },
        handleShowNote() {
            this.is_show_note = !this.is_show_note
        },
        handleModalSetting() {
            this.showSetting = !this.showSetting
        },
        showModalSettingContent() {
            this.showSettingContent = true
        },
        hideModalSettingContent() {
            this.showSettingContent = false
        },
        showFormLogin() {
            console.log('close run');
            this.showLogin()
            this.hideModalSettingContent()
        },
        hideFormLogin() {
            this.hideLogin()
            this.showModalSettingContent()
        },
        handleShowOrderInfo() {
            let check = this.validateCreateDelivery()
            if (check == 'failed') return
            if (!check) {
                return this.swalToast('Vui lòng điền đầy đủ thông tin', 'warning')
            }
            this.handleAddress()
            this.infoDelivery()
            this.is_show_order_info = true
        },
        handleHideOrderInfo() {
            this.is_show_order_info = false
        },
        handleSwitch() {
            this.switch_order_id = !this.switch_order_id
            localStorage.setItem('widget_delivery_switch_order_id', JSON.stringify(this.switch_order_id))
            if (this.switch_order_id) {
                return this.handleCreateOrderId()
            }
            this.order_info.order_id = ''
        },
        async checkKeyBoard(ele_id, event, formatNumber, string) {
            if (
                event.keyCode == 37 ||
                event.keyCode == 39 ||
                event.keyCode == 8 ||
                event.keyCode == 46
            )
                return
            let caret_pos = event.target.selectionStart
            let input = document.getElementById(ele_id)
            let number_length = await formatNumber(string)
            //handle caret_pos when number length = 3*x+1
            if (number_length == Math.floor(number_length / 3) * 3 + 1) {
                caret_pos = caret_pos + 1
            }
            //focus in position
            if (input != null) {
                if (input.createTextRange) {
                    let range = input.createTextRange()
                    range.move("character", caret_pos)
                    range.select()
                } else {
                    if (input.selectionStart) {
                        input.focus()
                        input.setSelectionRange(caret_pos, caret_pos)
                    } else input.focus()
                }
            }

            if (event.keyCode == 8) {
            }
        },
        async formatNumberCod(string) {
            let number = string.replace(/\D/g, "")
            this.order_info.cod_amount_num = number
            this.order_info.cod_amount = new Intl.NumberFormat("de-DE", {
                style: "currency",
                currency: "VND",
            }).format(number)
            return number.length
        },
        async formatNumberPrice(string) {
            let number = string.replace(/\D/g, "")
            this.product_price_num = number
            this.product_price = new Intl.NumberFormat("de-DE", {
                style: "currency",
                currency: "VND",
            }).format(number)
            return number.length
        },
        swalToast(title, icon, timer = 2000) {
            const Toast = Swal.mixin({
                toast: true,
                position: "center",
                showConfirmButton: false,
                width: '80vw',
                timer: timer,
                timerProgressBar: false,
                onOpen: (toast) => {
                    toast.addEventListener("mouseenter", Swal.stopTimer)
                    toast.addEventListener("mouseleave", Swal.resumeTimer)
                },
            });
            Toast.fire({
                icon: icon,
                title: title,
                padding: "5px",
            })
        },
    },
    watch: {
        store_token: function () {
            this.order_info.receiver_name = this.payload.name
            this.order_info.receiver_phone = this.payload.phone
            this.order_info.receiver_email = this.payload.email
        },
        'payload.store_email': function () {
            this.order_info.sender_email = this.payload.store_email
        },
        'order_info.order_service': function () {
            this.handleShippingFeeVTP()
        },
        list_product: function (new_value) {
            if (new_value.length > 0)
                this.getShippingFee()
        },
        'order_info.receiver_province': function () {
            this.handleChangeCity()
        },
        'order_info.receiver_district': function () {
            this.handleChangeDistrict()
        },
        'order_info.receiver_ward': function () {
            this.handleChangeWard()
        },
        product_price_num: function () {
            this.handlePriceTimeout()
        }
    },
    filters: {
        toCurrency(value) {
            if (typeof value !== "number") {
                return value
            }
            let formatter = new Intl.NumberFormat("de-DE", {
                style: "currency",
                minimumFractionDigits: 0,
                currency: "VND",
            });
            return formatter.format(value)
        },
    },
    beforeDestroy() {
        EventBus.$off("show-modal-setting", () => {
            this.showFormLogin()
        });
        EventBus.$off("hide-modal-setting", () => {
            this.hideFormLogin()
        });
    }
};