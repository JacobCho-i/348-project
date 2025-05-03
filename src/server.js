const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'myuser',
  password: 'admin',
  database: 'cs348_db',
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
});


app.get('/reservations-filter', async (req, res) => {
  const { name, date, minGuests } = req.query;
  console.log( { name, date, minGuests })

  let query = 'SELECT * FROM Reservation WHERE 1=1';
  const values = [];

  if (name) {
    query += ' AND res_name LIKE ?';
    values.push(`%${name}%`);
  }
  if (date) {
    query += ' AND date = ?';
    values.push(date);
  }
  if (minGuests) {
    query += ' AND number_of_guest >= ?';
    values.push(Number(minGuests));
  }

  try {
    db.beginTransaction(err => {
      if (err) {
        console.error('Transaction start error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      db.query('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED', (err) => {
        if (err) {
          return db.rollback(() => {
            console.error('Isolation level error:', err);
            return res.status(500).json({ error: 'Failed to set isolation level' });
          });
        }

        db.query(query, values, (err, results) => {
          if (err) {
            return db.rollback(() => {
              console.error('Query error:', err);
              return res.status(500).json({ error: 'Database query error' });
            });
          }

          db.commit(err => {
            if (err) {
              return db.rollback(() => {
                console.error('Commit error:', err);
                return res.status(500).json({ error: 'Transaction commit failed' });
              });
            }

            res.json(results);
          });
        });
      });
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/reservations', (req, res) => {
  try {
    db.query('CALL getAllReservations()', (err, results) => {
      if (err) {
        console.error('Stored procedure error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json(results[0]);
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/reservations', (req, res) => {
    try {
        const { name, number, date, time } = req.body;

        const sql = 'INSERT INTO Reservation (res_name, number_of_guest, date, time) VALUES (?, ?, ?, ?)';
        const values = [name, number, date, time];

        db.beginTransaction(err => {
          if (err) {
            console.error('Transaction start error:', err);
            return res.status(500).json({ error: 'Database error' });
          }
    
          db.query('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED', (err) => {
            if (err) {
              return db.rollback(() => {
                console.error('Isolation level error:', err);
                return res.status(500).json({ error: 'Failed to set isolation level' });
              });
            }
    
            db.query(sql, values, (err, results) => {
              if (err) {
                return db.rollback(() => {
                  console.error('Query error:', err);
                  return res.status(500).json({ error: 'Database insert error' });
                });
              }
    
              db.commit(err => {
                if (err) {
                  return db.rollback(() => {
                    console.error('Commit error:', err);
                    return res.status(500).json({ error: 'Transaction commit failed' });
                  });
                }
    
                res.status(201).json({
                  message: 'Reservation created',
                  reservationId: results.insertId
                });
              });
            });
          });
        });

      } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Server error' });
      }
});

app.put('/reservations/:id', (req, res) => {
    const { id } = req.params;
    const { name, number, date, time } = req.body;

    console.log({ name, number, date, time })
  
    if (!name || !date || !time) {
      return res.status(400).json({ error: 'Missing fields for update' });
    }
  
    const query = `
      UPDATE Reservation
      SET res_name = ?, number_of_guest = ?, date = ?, time = ?
      WHERE id = ?
    `;
  
    const values = [name, number, date, time, id];

    db.beginTransaction(err => {
      if (err) {
        console.error('Transaction start error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      db.query('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED', (err) => {
        if (err) {
          return db.rollback(() => {
            console.error('Isolation level error:', err);
            return res.status(500).json({ error: 'Failed to set isolation level' });
          });
        }

        db.query(query, values, (err, results) => {
          if (err) {
            return db.rollback(() => {
              console.error('update error:', err);
              return res.status(500).json({ error: 'Database update error' });
            });
          }

          db.commit(err => {
            if (err) {
              return db.rollback(() => {
                console.error('Commit error:', err);
                return res.status(500).json({ error: 'Transaction commit failed' });
              });
            }
            res.json({ message: 'Reservation updated' });
          });
        });
      });
    });
  
  });

  app.delete('/reservations/:id', (req, res) => {
    const { id } = req.params;
  
    const c_query = 'DELETE FROM Customer WHERE reservation = ?;';
    const query = 'DELETE FROM Reservation WHERE id = ?';

    db.beginTransaction(err => {
      if (err) {
        console.error('Transaction start error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      db.query('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED', (err) => {
        if (err) {
          return db.rollback(() => {
            console.error('Isolation level error:', err);
            return res.status(500).json({ error: 'Failed to set isolation level' });
          });
        }
        db.query(c_query, [id], (err, results) => {
          if (err) {
            return db.rollback(() => {
              console.error('delete error:', err);
              return res.status(500).json({ error: 'Database delete error' });
            });
          }
        })

        db.query(query, [id], (err, results) => {
          if (err) {
            return db.rollback(() => {
              console.error('delete error:', err);
              return res.status(500).json({ error: 'Database delete error' });
            });
          }
          if (results.affectedRows === 0) {
            return db.rollback(() => {
              return res.status(404).json({ message: 'Reservation not found' });
            });
          }

          db.commit(err => {
            if (err) {
              return db.rollback(() => {
                console.error('Commit error:', err);
                return res.status(500).json({ error: 'Transaction commit failed' });
              });
            }
            res.json({ message: 'Reservation deleted' });
          });
        });
      });
    });
  });

  app.get('/customer/:id', (req, res) => {
    try {
      const { id } = req.params;
      db.query(`CALL getAllCustomersForRes(${id})`, (err, results) => {
        if (err) {
          console.error('Stored procedure error:', err);
          res.status(500).json({ error: 'Database error' });
        } else {
          res.json(results[0]);
        }
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  app.post('/customer', (req, res) => {
      try {
          const { customer_name, age, reservation } = req.body;
  
          const sql = 'INSERT INTO Customer (customer_name, age, reservation) VALUES (?, ?, ?)';
          const values = [customer_name, age, reservation];

          db.beginTransaction(err => {
            if (err) {
              console.error('Transaction start error:', err);
              return res.status(500).json({ error: 'Database error' });
            }
      
            db.query('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED', (err) => {
              if (err) {
                return db.rollback(() => {
                  console.error('Isolation level error:', err);
                  return res.status(500).json({ error: 'Failed to set isolation level' });
                });
              }
      
              db.query(sql, values, (err, results) => {
                if (err) {
                  return db.rollback(() => {
                    console.error('Query error:', err);
                    return res.status(500).json({ error: 'Database insert error' });
                  });
                }
      
                db.commit(err => {
                  if (err) {
                    return db.rollback(() => {
                      console.error('Commit error:', err);
                      return res.status(500).json({ error: 'Transaction commit failed' });
                    });
                  }
      
                  res.status(201).json({
                    message: 'Customer created',
                    reservationId: results.insertId
                  });
                });
              });
            });
          });
          
        } catch (error) {
          console.error('Unexpected error:', error);
          res.status(500).json({ error: 'Server error' });
        }
  });
  
    app.delete('/customer/:id', (req, res) => {
      const { id } = req.params;
    
      const query = 'DELETE FROM Customer WHERE customer_id = ?';

      db.beginTransaction(err => {
        if (err) {
          console.error('Transaction start error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
  
        db.query('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED', (err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Isolation level error:', err);
              return res.status(500).json({ error: 'Failed to set isolation level' });
            });
          }
  
          db.query(query, [id], (err, results) => {
            if (err) {
              return db.rollback(() => {
                console.error('delete error:', err);
                return res.status(500).json({ error: 'Database delete error' });
              });
            }
            if (results.affectedRows === 0) {
              return db.rollback(() => {
                return res.status(404).json({ message: 'Reservation not found' });
              });
            }
  
            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  console.error('Commit error:', err);
                  return res.status(500).json({ error: 'Transaction commit failed' });
                });
              }
              res.json({ message: 'Customer deleted' });
            });
          });
        });
      });

    });

app.listen(5000, () => console.log('Server running on port 5000'));
