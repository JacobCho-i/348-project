import './App.css';
import { useState, useEffect } from 'react';

function App() {



  const [ customerList, setCustomerList ] = useState([])
  const [ customers, setCustomers ] = useState([])
  const [ reservation, setReservation ] = useState([])
  const [ reservationData, setReservationData ] = useState([])


  const [ rev, setRev] = useState('');
  const [ date, setDate] = useState('');
  const [ time, setTime] = useState('');
  const [ customerName, setCustomerName] = useState('');
  const [ age, setAge] = useState('');   

  const [users, setUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editId, setEditId] = useState(null);

  const [ filter_name, setName] = useState('');
  const [ filter_date, setFDate] = useState('');
  const [ filter_num, setNum] = useState('');   

  useEffect(() => {
    fetchData()
  }, []);

  const fetchData = async() => {
    setReservation([]);
    fetch('http://localhost:5000/reservations')
      .then(res => res.json())
      .then(data => {
        setReservationData(data);
        processReservation(data)
        console.log(data);
      })
      .catch(err => console.error('Error fetching users:', err));
  }

  const processReservation = (data) => {
    data.map((res) => (
      setReservation(prev => [...prev, `Name: ${res.res_name}, date: ${res.date.split("T")[0]}, time: ${res.time}, number of customers: ${res.number_of_guest}&${res.id}`])
    ))
  }

  const refetchData = () => {
    fetch('http://localhost:5000/reservations')
      .then(res => res.json())
      .then(data => {
        setReservationData(data);
        processReservation(data)
        console.log(data);
      })
      .catch(err => console.error('Error fetching users:', err));
  }

  const resetFilter = () => {
    setName('');
    setFDate('');
    setNum('');
    fetchData();
  }

  const handleRev = (e) => {
    setRev(e.target.value);
  };

  const handleDate = (e) => {
    setDate(e.target.value);
  };

  const handleTime = (e) => {
    setTime(e.target.value);
  };

  const handleName = (e) => {
    setName(e.target.value);
  };

  const handleFDate = (e) => {
    setFDate(e.target.value);
  };

  const handleNum = (e) => {
    setNum(e.target.value);
  };

  const handleCustomerName = (e) => {
    setCustomerName(e.target.value);
  };

  const handleAge = (e) => {
    setAge(e.target.value);
  };

  const addCustomer = async () => {
    if (isEditing) {
      const customerData = {
        customer_name: customerName,
        age: age,
        reservation: editId,
      };
      const response = await fetch('http://localhost:5000/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      });

      const result = await response.json();
      console.log('response received:', result);
      setAge('');
      setCustomerName('');
      setCustomers(pre => [...pre, customerName])
      return
    }
    setCustomers(pre => [...pre, customerName])
    setCustomerList(pre => [...pre, {'name': customerName, 'age': age}])
    setAge('');
    setCustomerName('');
  }

  const removeCustomer = async (name) => {
    if (isEditing) {

      const response = await fetch(`http://localhost:5000/customer/${customerList.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('response received:', response);
      setAge('');
      setCustomerName('');
      return
    }
    setCustomers(prev => prev.filter(item => item !== name));
    setCustomerList(prev => prev.filter(item => item.name !== name));
  }

  const addReservation = async () => {  
    const addedData = {
      name: rev,
      number: customers.length,
      date: date,
      time: time
    };

    try {
      const response = await fetch('http://localhost:5000/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addedData)
      });

      const result = await response.json();
      console.log('Add response:', result);
      const res_id = result.reservationId;
      console.log('new id:', result.reservationId);

      // adding customers 

      for (const entry of customerList) {
        console.log('adding customer:', entry);
        const customerData = {
          customer_name: entry.name,
          age: entry.age,
          reservation: res_id,
        };
        const response = await fetch('http://localhost:5000/customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customerData)
        });
  
        const result = await response.json();
        console.log('response received:', result);
      }
      setRev('');
      setDate('');
      setTime('');
      setReservation([]);
      setCustomerList([]);
      setCustomers([]);
      refetchData();
    } catch (error) {
      console.error('Error updating reservation:', error);
    }
      console.log(users);
  }

  const switchEditing = async (name, id) => {
    setIsEditing(true);
    setEditing(name);
    setEditId(id);
    const entry = reservationData.find(item => item.id == id);
    console.log(reservationData, id);
    console.log(entry);
    setRev(entry.res_name);
    setDate(entry.date.split('T')[0]);
    setTime(entry.time);

    fetch(`http://localhost:5000/customer/${id}`)
    .then(res => res.json())
    .then(data => {
      console.log(data);
      setCustomerList(data);
      const names = data.map(item => item.customer_name);
      setCustomers(names);
    })
    .catch(err => console.error('Error fetching users:', err));
  }

  const switchAdding = () => {
    setIsEditing(false);
    setEditing(null);
    setEditId(null);
    setRev('');
    setDate('');
    setTime('');
    setCustomerList([]);
    setCustomers([]);
  }

  const applyFilter = async() => {
    const query = new URLSearchParams();

    if (filter_name != '') query.append('name', filter_name);
    if (filter_date != '') query.append('date', filter_date);
    if (filter_num != '') query.append('minGuests', filter_num);
  
    const response = await fetch(`http://localhost:5000/reservations-filter?${query.toString()}`)
    .then(res => res.json())
    .then(data => {
      console.log(data);
      setReservation([]);
      setReservationData(data);
      processReservation(data)
      console.log(data);
    })
    .catch(err => console.error('Error fetching users:', err));
  }

  const editReservation = async () => {
    const updatedData = {
      name: rev,
      number: customers.length,
      date: date,
      time: time
    };
    console.log(updatedData)

    try {
      const response = await fetch(`http://localhost:5000/reservations/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      });

      const result = await response.json();
      console.log('Edit response:', result);
      
      setRev('');
      setDate('');
      setTime('');
      setReservation([]);
      refetchData();
    } catch (error) {
      console.error('Error updating reservation:', error);
    }
      console.log(users);
  }

  const deleteReservation = async (id) => {
    try {
      console.log('deleting ', id)
      const response = await fetch(`http://localhost:5000/reservations/${id}`, {
        method: 'DELETE',
      });
  
      const result = await response.json();
      console.log('Delete response:', result);
      setReservation([]);
      refetchData();
    } catch (error) {
      console.error('Error deleting reservation:', error);
    }
  }

  return (
    <div className="App">
      <p>
      {
            isEditing ? 
            <>editing {editing}: </>
            :
            <>reservation name: </>
          }
      </p>
      <div className='big-penal'>
        <div className='left-side'>
          reservation name:
          <input value={rev} onChange={handleRev}/>
          date: 
          <input value={date} onChange={handleDate}/>
          time: 
          <input value={time} onChange={handleTime}/>
          { 
            isEditing ? 
            <>
              <button onClick={editReservation}>Edit</button>
              <button onClick={switchAdding}>Cancel Edit</button>
            </>
            :
            <button onClick={addReservation}>Add</button>
          }
          
        </div>
        <div className='right-side'>
          customers: 
          <div></div>
          {customers.map((name, index) => (
            <div style={{display: 'flex', gap: '20px'}} key={index}>{name}<button onClick={() => removeCustomer(name)}>delete</button></div>
          ))}
          Customer name: 
          <input value={customerName} onChange={handleCustomerName}/>
          Age: 
          <input value={age} onChange={handleAge}/>
          <button onClick={addCustomer}>Add Customer</button>
        </div>
      </div>

      <p>
          Your reservation:
      </p>
      { !isFiltering ? 
      <>
      <button onClick={() => setIsFiltering(true)}>Filter</button>
      <div className='filter-penal'>
      reservation name:
      <input value={filter_name} onChange={handleName}/>
      date: 
      <input value={filter_date} onChange={handleFDate}/>
      minimum customers: 
      <input value={filter_num} onChange={handleNum}/>
      <button onClick={applyFilter}>apply filter</button>
      <button onClick={resetFilter}>reset filter</button>
      </div>
      </>
      : 
      <>
      <button onClick={() => setIsFiltering(false)}>Close filter</button>
      </>
      }
      {reservation.map((log, index) => (
        <div className='small-penal'>
            <div key={index}>{log.split('&')[0]}</div>
            <button className='edit-button' onClick={() => switchEditing(log.split('&')[0].substring(6, log.split('&')[0].indexOf(',')), log.split('&')[1])}>Edit</button>
            <button className='delete-button' onClick={() => deleteReservation(log.split('&')[1])}>Delete</button>
      </div>
          ))}
    </div>
  );
}

export default App;
