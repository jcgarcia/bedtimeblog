import React, { useState } from 'react';
import './cognito-admin.css';

const defaultConfig = {
  userPoolId: '',
  clientId: '',
  region: '',
  enabled: false,
  groupMappings: {
    admin: '',
    writer: '',
    editor: ''
  }
};

export default function CognitoAdminPanel({ config = defaultConfig, onSave }) {
  const [form, setForm] = useState(config);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'enabled') {
      setForm({ ...form, enabled: checked });
    } else if (name.startsWith('groupMappings.')) {
      const group = name.split('.')[1];
      setForm({
        ...form,
        groupMappings: { ...form.groupMappings, [group]: value }
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) onSave(form);
  };

  return (
    <div className="cognito-admin-panel">
      <h2>AWS Cognito Configuration</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Enable Cognito Auth:
          <input type="checkbox" name="enabled" checked={form.enabled} onChange={handleChange} />
        </label>
        <label>
          User Pool ID:
          <input type="text" name="userPoolId" value={form.userPoolId} onChange={handleChange} />
        </label>
        <label>
          App Client ID:
          <input type="text" name="clientId" value={form.clientId} onChange={handleChange} />
        </label>
        <label>
          AWS Region:
          <input type="text" name="region" value={form.region} onChange={handleChange} />
        </label>
        <fieldset>
          <legend>Group Mappings</legend>
          <label>
            Admin Group:
            <input type="text" name="groupMappings.admin" value={form.groupMappings.admin} onChange={handleChange} />
          </label>
          <label>
            Writer Group:
            <input type="text" name="groupMappings.writer" value={form.groupMappings.writer} onChange={handleChange} />
          </label>
          <label>
            Editor Group:
            <input type="text" name="groupMappings.editor" value={form.groupMappings.editor} onChange={handleChange} />
          </label>
        </fieldset>
        <button type="submit">Save Configuration</button>
      </form>
    </div>
  );
}
