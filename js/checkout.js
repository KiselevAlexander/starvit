import Validator from './utils/validator';
import { formatNumber } from './utils/formar-phone-number';
import { shiptorMakeMap } from './map';

const validateForm = (fields) => {
  const errors = {};

  Object.keys(fields).forEach((field) => {
    let check;

    switch (field) {
      case 'billing_phone':
        check = Validator.phone(fields[field], true);
        break;
      case 'billing_email':
        check = Validator.email(fields[field], true);
        break;
      default:
        check = Validator.string(fields[field], true, 2, 60);
        break;
    }

    if (check !== true) {
      errors[field] = check;
    }
  });
  return Object.keys(errors).length === 0 || errors;
};


const Form = {
  name: null,
  lastName: null,
  phone: null,
  email: null,
  city: null,
  deliveryType: null,
  address: null,
  postCode: null,
};

const Sidebar = {
  _wrapSidebarItem(val) {
    return `<p class="checkout__info_order_descr">${val}</p>`;
  },
  setInitials(initials) {
    $('.js-sidebar-initials-wrapper').html(initials);
    return this;
  },
  setCity(city) {
    $('.js-sidebar-city-placeholder').html(this._wrapSidebarItem(city));
    return this;
  },
  setDelivery(type) {
    $('.js-sidebar-delivery-placeholder').html(this._wrapSidebarItem(type));
    return this;
  },
  setAddress(initials, city, address, postCode, phone) {
    const data = [
      initials,
      address,
      city,
      postCode,
      formatNumber(phone),
    ];
    $('.js-sidebar-address-placeholder').html(data.reduce((res, item) => res + this._wrapSidebarItem(item), ''));
    return this;
  },
  setPayment(type) {
    $('.js-sidebar-payment-placeholder').html(this._wrapSidebarItem(type));
    return this;
  },
  enableChangeButton(step) {
    $(`[data-step="${step}"]`).removeClass('-disabled');
    return this;
  }

};


const toggleStep = (name) => {

  var addOpenClasses = [
    'checkout__form_item--active',
  ];

  if (name === 'delivery') {
    addOpenClasses.push('checkout__form_item-delivery--open');
    $('.checkout__form_item-delivery').addClass('checkout__form_item-delivery--open');
    $('.checkout__delivery_select').show();
  } else {
    $('.checkout__form_item-delivery').removeClass('checkout__form_item-delivery--open');
    $('.checkout__delivery_select').hide();
  }

  $('.checkout__form_item:not(.checkout__form_item--' + name + ')').removeClass('checkout__form_item--active')
    .addClass('checkout__form_item--done');

  $('.checkout__form_item--' + name).addClass(addOpenClasses.join(' '))
    .removeClass('checkout__form_item--done');
};

const toggleToDoorForm = (block, firstName = '', lastName = '', address = '', postcode = '') => {
  const $addressesList = $(block).parent().parent().find('.checkout__delivery_house_wrap');
  const $form = $(block).parent().parent().find('.checkout__form_registration_form_wrap');

  if (!$addressesList.hasClass('-hidden')) {
    $addressesList.slideUp().addClass('-hidden');
    $form.find('.checkout__delivery_house_add_firstname').val(firstName);
    $form.find('.checkout__delivery_house_add_lastname').val(lastName);
    $form.find('.checkout__delivery_house_add_address').val(address);
    $form.find('.checkout__delivery_house_add_postcode').val(postcode);
    $form.slideDown();
  } else {
    $form.slideUp();
    $addressesList.slideDown().removeClass('-hidden');
  }
};

export default () => {

  console.log("подключен модуль чекаута");

  // Чекаут авторизация/регистрация
  const changeLoginRegistration = (e) => {
    e.preventDefault();

    // находим блок текущего шага
    const wrapper = $('.checkout__form_item--auth');

    // меняем авторизация/регистрация
    if (wrapper.hasClass('changed')) {
      wrapper.find('.checkout__form_title_title:first-child').text('Представтесь');
      wrapper.find('.checkout__form_title_link').text('Логин');
      wrapper.find('.checkout__form_descr span').html('Если вы уже являетесь зарегистрированным пользователем то');
      wrapper.find('.checkout__form_descr a').html('залогиньтесь');
      wrapper.removeClass('changed');
    } else {
      wrapper.find('.checkout__form_title_title:first-child').text('Залогиньтесь');
      wrapper.find('.checkout__form_title_link').text('Регистрация');
      wrapper.find('.checkout__form_descr span').text('Если у вас еще нет учетной записи то');
      wrapper.find('.checkout__form_descr a').text('зарегистрируйтесь');
      wrapper.addClass('changed');
    }

    // показываем/скрываем блоки авторизация/регистрация
    $('.checkout__form_login').toggle();
    $('.checkout__form_registration').toggle();
  };

  // устанавливаем обработчик смены авторизация/регистрация
  $('.checkout__form_item--auth .js-change-form').on('click', changeLoginRegistration);

  // обработчик смены первого шага, чисто для показа заказчику
  $('.js-checkout-first-step-end').on('click', function () {

    const fields = {
      billing_first_name: $('[name="billing_first_name"]'),
      billing_last_name: $('[name="billing_last_name"]'),
      billing_phone: $('[name="billing_phone"]'),
      billing_email: $('[name="billing_email"]'),
    };

    const validation = validateForm({
      billing_first_name: fields.billing_first_name.val(),
      billing_last_name: fields.billing_last_name.val(),
      billing_phone: fields.billing_phone.val(),
      billing_email: fields.billing_email.val(),
    });

    if (validation !== true) {
      Object.keys(fields).forEach((field) => {
        if (Object.keys(validation).includes(field)) {
          fields[field].css('border-color', 'red');
        } else {
          fields[field].css('border-color', '#e1e0df');
        }
      });

      return;
    }

    Form.name = fields.billing_first_name.val();
    Form.lastName = fields.billing_last_name.val();
    Form.email = fields.billing_email.val();
    Form.phone = fields.billing_phone.val();

    Sidebar.setInitials(`${fields.billing_last_name.val()} ${fields.billing_first_name.val()}`)
      .enableChangeButton('auth');

    toggleStep('country');
  });


  // обработчик клика по кнопке "выбери страну"
  $('.js-select-country-button').on('click', function (e) {
    e.preventDefault();

    // показываем список стран
    $('.checkout__form_country').show();
  });

  // обработчик смены второго шага
  $('.js-checkout-second-step-end').on('click', function () {
    const _self = this;
    const $cityField = $('#billing_city');
    const city = $cityField.val();

    if (city) {
      $('.select2-selection').css('border-color', '#e1e0df');
    } else {
      $('.select2-selection').css('border-color', 'red');
      return;
    }

    Form.city = city;
    Sidebar.setCity(city)
      .enableChangeButton('country');

    $(_self).attr('disabled', 'disabled');
    $cityField.attr('disabled', 'disabled');

    jQuery.post('/?wc-ajax=get_delivery_methods_info', {}, function (methods) {
      $(_self).removeAttr('disabled');
      $cityField.removeAttr('disabled');

      var el = $('.checkout__form_item--delivery-1');
      var method = methods['to-door'];

      if (method) {
        el.show();
        el.find('.checkout__form_title_title span').html('Курьерская доставка ' + method.label + ' <b> от ' + method.cost + '₽</b></p>');
        el.data('data-method', method.code);
      } else {
        el.hide();
      }

      el = $('.checkout__form_item--delivery-2');
      method = methods['delivery-point'];

      if (method) {
        el.show();
        el.find('.checkout__form_title_title span').html('<b>от ' + method.cost + '₽</b>');
        el.data('data-method', method.code);
      } else {
        el.hide();
      }

      el = $('.checkout__form_item--delivery-3');
      method = methods['post-office'];

      if (method) {
        el.show();
        el.find('.checkout__form_title_title span').html('<b>от ' + method.cost + '₽</b>');
        el.data('data-method', method.code);
      } else {
        el.hide();
      } // находим блок текущего шага

      toggleStep('delivery');
    });
  });

  // обработчик смены третьего шага
  $('.js-checkout-select-shipping-select').on('click', function (e) {
    e.preventDefault();

    const selectedAddress = $('[name="delivery_method"]:checked');

    if (!selectedAddress.length) {
      return;
    }

    Form.address = selectedAddress.data('address');
    Form.postCode = selectedAddress.data('postcode');
    Form.deliveryType = selectedAddress.data('method');

    Sidebar.setAddress(
      `${Form.lastName} ${Form.name}`,
      Form.city,
      Form.address,
      Form.postCode,
      Form.phone,
    ).setDelivery(Form.deliveryType)
      .enableChangeButton('delivery');

    $("#billing_address_1").val(Form.address);
    $("#billing_to_door_address").val(Form.address);
    $("#billing_postcode").val(Form.postCode);
    $("input[name='shipping_method[0]']").val(Form.deliveryType);

    const pointid = selectedAddress.data('pointid');

    if (pointid) {
      $.post(shiptor_checkout_params.delivery_point_url, {
        'delivery_point': pointid
      }, function (data) {
        console.log(data);
      });
    }


    $( document.body ).trigger( 'update_checkout');

    toggleStep('pay');
  });


  $('.js-delivery-door').on('click', function (e) {
    e.preventDefault();
    toggleToDoorForm(this, Form.name, Form.lastName);
  });

  $('.js-delivery-post').on('click', function (e) {
    e.preventDefault();
    toggleToDoorForm(this);
  });

  let delivery_method_id = 0;

  $('.js-checkout-select-shipping').on('click', function () {

    const inner = $(this).parent().find('.checkout__form_registration_form input');
    let errors = [];

    inner.each((i, el) => {
      if (!$(el).val()) {
        $(el).css('border-color', 'red');
        errors.push(1);
      } else {
        $(el).css('border-color', '#e1e0df');
      }
    });

    if (errors.length) {
      return;
    } else {

      const label = $(this).parent().parent().find('.checkout__delivery_house_items');

      var $form = $(this).parent().find('.checkout__form_registration_form');
      var firstname = $form.find('.checkout__delivery_house_add_firstname').val();
      var lastname = $form.find('.checkout__delivery_house_add_lastname').val();

      var address = $form.find('.checkout__delivery_house_add_address').val();
      var postcode = $form.find('.checkout__delivery_house_add_postcode').val();
      var method = $(this).parent().parent().parent().find('.checkout__form_item').data('data-method');

      var phone = $('#billing_phone').val();
      var city = $('#billing_city').val();


      delivery_method_id++;

      const createElement = (delivery_method_id, method, city, address, postcode, firstName, lastName, phone) => {
        const wrapContentItem = (text) => `<p class="checkout__delivery_house_item_descr">${text}</p>`;

        const wrapper = $('<div class="checkout__delivery_house_item" />');
        const label = $(`<label for="${delivery_method_id}" />`);
        const input = $(`<input type="radio" id="${delivery_method_id}" name="delivery_method" />`);
        input.attr('data-method', method);
        input.attr('data-address', address);
        input.attr('data-postcode', postcode);
        const contentWrapper = $('<div class="checkout__delivery_house_item_content" />');
        contentWrapper.append(wrapContentItem(`${lastName} ${firstName}`));
        contentWrapper.append(wrapContentItem(address));
        contentWrapper.append(wrapContentItem(city));
        contentWrapper.append(wrapContentItem(postcode));
        contentWrapper.append(wrapContentItem(formatNumber(phone)));
        const controlsWrapper = $(' <div class="checkout__delivery_house_item_control" />');
        const edit = $('<p class="checkout__delivery_house_item_control-btn js-delivery-house-item-edit">Редактировать</p>');
        edit.on('click', () => {
            toggleToDoorForm($('.js-delivery-door'), firstName, lastName, address, postcode);
        });
        const remove = $('<p class="checkout__delivery_house_item_control-btn js-delivery-house-item-remove">Удалить адрес</p>');
        controlsWrapper.append(edit);
        controlsWrapper.append(remove);
        contentWrapper.append(controlsWrapper);

        wrapper.append(input).append(label).append(contentWrapper);
        return wrapper;
      };

      label.append(createElement(
        delivery_method_id,
        method,
        city,
        address,
        postcode,
        firstname,
        lastname,
        phone
      ));

      label.find('.js-delivery-house-item-remove').on('click', function () {
        $(this).parent().parent().parent().remove();
      });

      $('.checkout__delivery_house_wrap').slideDown().removeClass('-hidden');;
      $(this).parent().parent().find('.checkout__form_registration_form_wrap').slideUp();

      $('.checkout__wrapper').addClass('fix-ship-row');
    }
  });

  var shiptor_get_selected_point = null;
  $('.js-delivery-delivery-point').on('click', function (e) {
    e.preventDefault();
    $(this).parent().parent().find('.checkout__delivery_house_wrap').slideUp().removeClass('-hidden');

    var container = $(this).parent().parent().find('.checkout__form_registration_form_wrap');

    container.slideDown();

    if (shiptor_get_selected_point == null) {
      jQuery.post('/?wc-ajax=get_all_delivery_points', {}, function (points) {
        shiptor_get_selected_point = shiptorMakeMap(points, 'shiptor_map_container', 'shiptor_map_point_list');
      });
    }
  });

  $('.js-checkout-select-shipping-map').on('click', function () {

    var label = $(this).parent().parent().parent().find('.checkout__delivery_house_items');
    label.empty();

    var point_info = shiptor_get_selected_point();
    var point = point_info.point;

    // TODO перенести на выбор адреса?
    // $("#billing_address_1").val(point.address);
    // $(shipping_method[0]).val(point_info.method_value);
    //
    // $.post(shiptor_checkout_params.delivery_point_url, {
    //   'delivery_point': point.id
    // }, function (data) {
    //   console.log(data);
    // });

    var distance, point_name, address = point.address, phone;

    var distance_str = ymaps.formatter.distance(point.distance);

    var phones = point.phones.join(', ');

    var elem ="\n" +
      "<div class=\"checkout__shipping_item\">\n" +
      "   <input type=\"radio\" name=\"delivery_method\" id=\"r5\" data-pointid='"+point.id0+"' data-address='"+point.address+"' data-postcode='' data-method='"+point_info.method_value+"'>\n" +
      "   <label for=\"r5\"></label>\n" +
      "   <div class=\"checkout__shipping_item_content\">\n" +
      "      <p class=\"checkout__shipping_item_title\">" +
      "          <span>"+distance_str+"</span> "+point.courier+"</p>\n" +
      "      <p class=\"checkout__shipping_item_descr\">"+ point.address +"</p>\n" +
      "      <p class=\"checkout__shipping_item_descr\">"+ phones +"</p>\n" +
      "   </div>\n" +
      "</div>";

    label.append(elem);
    $('.checkout__delivery_house_wrap').slideDown();
    $(this).parent().parent().slideUp();
  });

  $(function () {
    if ($('.js-label-for-shipping').length) {
      const content = $('.js-label-for-shipping').clone(true);
      $('.js-label-for-shipping').remove();
      $('.js-wrap-label-for-shipping').prepend(content);
      $('.js-label-for-shipping').show();
    }
  });

  // удаление адреса доставки
  $('.js-delivery-house-item-remove').on('click', function () {
    $(this).parent().parent().parent().remove();
  });


  /**
   * Обработка клика "изменить" в правом меню
   */

  $('.checkout__info_order_change').click(function(e) {

    e.preventDefault();
    const target = $(e.target);
    if (!target.hasClass('-disabled')) {
      toggleStep(target.data('step'));
    }
  });
}
