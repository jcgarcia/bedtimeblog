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
      <div style={{background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '24px'}}>
        <h4 style={{marginTop: 0}}>How to find required values:</h4>
        <ul style={{marginBottom: '8px'}}>
          <li><b>User Pool ID:</b> AWS Console &rarr; Cognito &rarr; User Pools &rarr; select your pool &rarr; Pool details.<br/>
            <a href="https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html" target="_blank" rel="noopener noreferrer">AWS Cognito User Pools Docs</a>
          </li>
          <li><b>App Client ID:</b> In your User Pool &rarr; App clients &rarr; copy the App client ID.<br/>
            <a href="https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html" target="_blank" rel="noopener noreferrer">App Clients Docs</a>
          </li>
          <li><b>AWS Region:</b> Shown in the AWS Console URL and Pool details (e.g., <code>us-east-1</code>).</li>
          <li><b>Group Mappings:</b> In User Pool &rarr; Groups, create groups named <code>Admin</code>, <code>Writer</code>, <code>Editor</code>.<br/>
            <a href="https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-groups.html" target="_blank" rel="noopener noreferrer">User Pool Groups Docs</a>
          </li>
        </ul>
        <div style={{fontSize: '0.95em', color: '#555'}}>
          For a full step-by-step guide, see <b>CognitoSetupGuide.md</b> in the project root.
        </div>
      </div>
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
