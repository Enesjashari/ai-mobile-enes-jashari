// TasksScreen.js
import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, FlatList, Text, TouchableOpacity } from 'react-native';
import { supabase } from './supabaseClient';

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.log('Fetch error:', error);
    else setTasks(data);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Add new task
  const addTask = async () => {
    if (newTask.trim() === '') return;

    const { data, error } = await supabase.from('tasks').insert({ title: newTask });
    if (error) console.log('Insert error:', error);
    else {
      setNewTask('');
      fetchTasks();
    }
  };

  // Toggle task done
  const toggleDone = async (id, is_done) => {
    const { error } = await supabase.from('tasks').update({ is_done: !is_done }).eq('id', id);
    if (error) console.log('Update error:', error);
    else fetchTasks();
  };

  // Edit task
  const editTask = async (id) => {
    if (!editingText) return;
    const { error } = await supabase.from('tasks').update({ title: editingText }).eq('id', id);
    if (!error) {
      setEditingTaskId(null);
      setEditingText('');
      fetchTasks();
    }
  };

  // Delete task
  const deleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) fetchTasks();
  };

  return (
    <View style={{ padding: 20, marginTop: 50 }}>
      <TextInput
        placeholder="New Task"
        value={newTask}
        onChangeText={setNewTask}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Button title="Add Task" onPress={addTask} />

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            {editingTaskId === item.id ? (
              <>
                <TextInput
                  style={{ borderWidth: 1, flex: 1, marginRight: 10, padding: 5 }}
                  value={editingText}
                  onChangeText={setEditingText}
                />
                <Button title="Save" onPress={() => editTask(item.id)} />
                <Button title="Cancel" onPress={() => setEditingTaskId(null)} />
              </>
            ) : (
              <>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleDone(item.id, item.is_done)}>
                  <Text
                    style={{
                      fontSize: 18,
                      textDecorationLine: item.is_done ? 'line-through' : 'none',
                    }}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
                <Button
                  title="Edit"
                  onPress={() => {
                    setEditingTaskId(item.id);
                    setEditingText(item.title);
                  }}
                />
                <Button title="Delete" onPress={() => deleteTask(item.id)} />
              </>
            )}
          </View>
        )}
      />
    </View>
  );
}
