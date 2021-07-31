
import Api from '../scripts/Api.js'
import * as constants from '../scripts/constants.js'

// изначально ни одна кнопка фильтра по комнатам не нажата
let isButtonActivate = false

const api = new Api()

window.addEventListener('scroll', () => {
  window.scrollY > 300 ? constants.buttonUp.classList.add('button-up_show') : constants.buttonUp.classList.remove('button-up_show')
}
)

const createSlider = (name, from, to, min, max) => {
  noUiSlider.create(name, {
    start: [from, to],
    connect: true,
    step: 1,
    range: {
      'min': min,
      'max': max
    }
  });

}
const updateTextSlider = (name, from, to) => {
  name.noUiSlider.on('update', function (values) {
    // console.log(values)
    from.textContent = new Intl.NumberFormat('ru-RU').format(Math.floor(values[0]))
    to.textContent = new Intl.NumberFormat('ru-RU').format(Math.floor(values[1]))
  });
}

createSlider(constants.sliderPrice, 9_000_000, 15_000_000, 5_500_000, 18_900_000)
createSlider(constants.sliderArea, 57, 97, 33, 123)
updateTextSlider(constants.sliderPrice, constants.priceFrom, constants.priceTo)
updateTextSlider(constants.sliderArea, constants.areaFrom, constants.areaTo)

// универсальная функция фильтрации данных
const filterResultData = (res, filterData) => {
  if(filterData.rooms.length === 0) {
    return res.filter(x => x.price >= filterData.priceFrom &&
      x.price <= filterData.priceTo &&
      x.area >= filterData.areaFrom &&
      x.area <= filterData.areaTo)
  }
  else {
    return res.filter(x => filterData.rooms.includes(x.rooms) &&
    x.price >= filterData.priceFrom &&
    x.price <= filterData.priceTo &&
    x.area >= filterData.areaFrom &&
    x.area <= filterData.areaTo)
  }
}

// получение значений после перетаскивания ползунка
constants.sliderPrice.noUiSlider.on('end', function (values) {
  api.getData()
    .then(res => {
      const filterData = getFilterData()
      return filterResultData(res, filterData)

    })
    .then(res => {
      // рендерим первые 5 элементов
      redrawApartments(res.slice(0, 5))
      refreshLoadMoreButton(res)
    })

})
constants.sliderArea.noUiSlider.on('end', function (values) {
  api.getData()
    .then(res => {
      const filterData = getFilterData()
      return filterResultData(res, filterData)
    })
    .then(res => {
      // рендерим первые 5 элементов
      redrawApartments(res.slice(0, 5))
      refreshLoadMoreButton(res)
    })
})

const refreshLoadMoreButton = (arr) => {
  // получение количества карточек, которые выведены
  const displayedApartmentsCount = document.querySelectorAll('.apartment-row').length

  if(Number(displayedApartmentsCount) < arr.length) {
    constants.btnResultLoad.classList.remove('result__load_disabled')
  }
  else {
    constants.btnResultLoad.classList.add('result__load_disabled')
  }
}

/**
 * Фильтрация набора данных в соответствии с настройками на форме фильтрации
 * @param dataSet Полный набор данных
 * @returns Отфильтрованный набор данных
 */
const filterDataSet = (dataSet) => {
  // получение установленных значений
  const filterSettings = getFilterData()

  // содержит ли массив активных кнопок значение из массива данных
  // dataset - результат, пришедший с сервера
  return filterResultData(dataSet, filterSettings)
}

/**
 * Загружает данные
 */
const getDataApartments = (from, count) => {

  api.getData().then(res => {
    const filteredData = filterDataSet(res);

    console.log('filteredData: ' + JSON.stringify(filteredData))

    // Обрезаем результаты. Берем начиная с from элементов count
    filteredData.slice(from, count).forEach(item => {
      addApartment(createApartment(item))
    })

    const displayedApartmentsCount = constants.apartmentContent.querySelectorAll('.apartment-row').length
    console.log('filteredData.length: ' + filteredData.length)
    console.log('displayedApartmentsCount: ' + Number(displayedApartmentsCount))
    refreshLoadMoreButton(filteredData)
  })
}

// загрузка первых 5 элементов
getDataApartments(0, 5)

function addApartment(item) {
  return constants.apartmentContent.append(item);
}

const createApartment = (item) => {
  const cardTemplate = document.querySelector('#apartment-template').content.querySelector('.apartment-row');

  const apartment = cardTemplate.cloneNode(true);
  const apartmentImage = apartment.querySelector('.apartment-row__image');
  apartmentImage.style.backgroundImage = `url(${item.image})`
  const apartmentRoom = apartment.querySelector('.apartment-row__room');
  apartmentRoom.textContent = item.rooms;
  const apartmentNumber = apartment.querySelector('.apartment-row__number');
  apartmentNumber.textContent = item.number;
  const apartmentArea = apartment.querySelector('.area-current');
  apartmentArea.innerText = item.area;
  // console.log(apartmentArea.textContent)
  // floors
  const apartmentCurrentFloor = apartment.querySelector('.apartment-row__current-floor');
  apartmentCurrentFloor.textContent = item.floor;
  const apartmentTotalFloor = apartment.querySelector('.apartment-row__total-floor');
  apartmentTotalFloor.textContent = item.floors;
  // price
  const apartmentPrice = apartment.querySelector('.price-current');
  apartmentPrice.textContent = new Intl.NumberFormat('ru-RU').format(item.price);
  return apartment;
}

// обработчик кнопки "Загрузить еще"
constants.btnResultLoad.addEventListener('click', () => {
  const displayedApartmentsCount = document.querySelectorAll('.apartment-row').length
  getDataApartments(displayedApartmentsCount, 20)
})

// прокрутка страницы
constants.buttonUp.addEventListener('click', () => {
  window.scroll({
    top: 0,
    behavior: 'smooth'
  });
})

// перерисовывает элементы
const redrawApartments = (data) => {
  // удаляет элементы
  constants.apartmentContent.innerHTML = ''
  data.forEach((item) => {
    addApartment(createApartment(item))
  })
  refreshLoadMoreButton(data)
}


// возвращает объект с текущими значениями фильтра
const getFilterData = () => {

  const priceRange = constants.sliderPrice.noUiSlider.get(true);
  const areaRange = constants.sliderArea.noUiSlider.get(true);

  return {
    rooms: [...document.querySelectorAll('.filter__room-button_active')].map(item => Number(item.dataset.rooms)),
    priceFrom: priceRange[0],
    priceTo: priceRange[1],
    areaFrom: areaRange[0],
    areaTo: areaRange[1]
  }
}


constants.buttonsRoom.forEach(item => {
  item.addEventListener('click', () => {
    if (item.classList.contains('filter__room-button_active')) {
      isButtonActivate = false
      item.classList.remove('filter__room-button_active')
    }
    else {
      item.classList.add('filter__room-button_active')
      isButtonActivate = true
    }
    let filteredLength = 0
    api.getData()
      .then(res => {
        console.log('data from server: ', res)
        const filterData = getFilterData()
        const filtered = filterResultData(res, filterData)
        filteredLength = filtered.length
        return filtered
      })
      .then(res => {
        // рендерим первые 5 элементов
        redrawApartments(res.slice(0, 5))
        refreshLoadMoreButton(res)
      })
  })
})

// кнопка "Сбросить параметры"
constants.resetButton.addEventListener('click', () => {
  constants.buttonsRoom.forEach(item => {
    isButtonActivate = false
    item.classList.remove('filter__room-button_active')
  })

  constants.sliderPrice.noUiSlider.set([9_000_000, 15_000_000])
  constants.sliderArea.noUiSlider.set([57, 97])

  constants.apartmentContent.innerHTML = ''

  api.getData()
    .then(res => {
      getDataApartments(res)
    })
})




let isSortingAscending = false
constants.sortPrice.addEventListener('click',() => {

  if(!isSortingAscending) {
    isSortingAscending = true
    api.getData()
    .then(res => {
      console.log('data from server: ', res)
      const filterData = getFilterData()
      const filtered = filterResultData(res, filterData)
      // filtered
      return filtered
    })
    .then(res => {
      return res.sort(function(obj1, obj2) {
        // Сортировка по возрастанию
        return obj1.price-obj2.price;
      })
    })
    .then(res => {
      // console.log(res)
      redrawApartments(res.slice(0, 5))
      // refreshLoadMoreButton(res)
    })
  }
  else {
    isSortingAscending = false
    api.getData()
    .then(res => {
      console.log('data from server: ', res)
      const filterData = getFilterData()
      const filtered = filterResultData(res, filterData)
      // filtered
      return filtered
    })
    .then(res => {

      return res.sort(function(obj1, obj2) {
        // Сортировка по возрастанию
        return obj2.price-obj1.price;
      })
    })
    .then(res => {
      // console.log(res)
      redrawApartments(res.slice(0, 5))
      // refreshLoadMoreButton(res)
    })
  }
})
constants.sortArea.addEventListener('click',() => {
  if(!isSortingAscending) {
    isSortingAscending = true
    api.getData()
    .then(res => {
      console.log('data from server: ', res)
      const filterData = getFilterData()
      const filtered = filterResultData(res, filterData)
      // filtered
      return filtered
    })
    .then(res => {
      return res.sort(function(obj1, obj2) {
        // Сортировка по возрастанию
        return obj1.area-obj2.area;
      })
    })
    .then(res => {
      // console.log(res)
      redrawApartments(res.slice(0, 5))
      refreshLoadMoreButton(res)
    })
  }
  else {
    isSortingAscending = false
    api.getData()
    .then(res => {
      console.log('data from server: ', res)
      const filterData = getFilterData()
      const filtered = filterResultData(res, filterData)
      // filtered
      return filtered
    })
    .then(res => {

      return res.sort(function(obj1, obj2) {
        // Сортировка по возрастанию
        return obj2.area-obj1.area;
      })
    })
    .then(res => {
      // console.log(res)
      redrawApartments(res.slice(0, 5))
      refreshLoadMoreButton(res)
    })
  }
})
constants.sortFloor.addEventListener('click',() => {
  if(!isSortingAscending) {
    isSortingAscending = true
    api.getData()
    .then(res => {
      console.log('data from server: ', res)
      const filterData = getFilterData()
      const filtered = filterResultData(res, filterData)
      // filtered
      return filtered
    })
    .then(res => {
      return res.sort(function(obj1, obj2) {
        // Сортировка по возрастанию
        return obj1.floor-obj2.floor;
      })
    })
    .then(res => {
      // console.log(res)
      redrawApartments(res.slice(0, 5))
      refreshLoadMoreButton(res)
    })
  }
  else {
    isSortingAscending = false
    api.getData()
    .then(res => {
      console.log('data from server: ', res)
      const filterData = getFilterData()
      const filtered = filterResultData(res, filterData)
      // filtered
      return filtered
    })
    .then(res => {

      return res.sort(function(obj1, obj2) {
        // Сортировка по возрастанию
        return obj2.floor-obj1.floor;
      })
    })
    .then(res => {
      // console.log(res)
      redrawApartments(res.slice(0, 5))
      refreshLoadMoreButton(res)
    })
  }
})
