export default {
    props: ['is_show_order_info', "order_info",'list_product_name','product_total_item', "createDelivery", "handleHideOrderInfo","payload"],
    data() {
        return {}
    },
    methods: {

    },

    filters: {
        toCurrency(value) {
            if (typeof value !== "number") {
                return value;
            }
            let formatter = new Intl.NumberFormat("de-DE", {
                style: "currency",
                minimumFractionDigits: 0,
                currency: "VND",
            });
            return formatter.format(value);
        },
    },
}