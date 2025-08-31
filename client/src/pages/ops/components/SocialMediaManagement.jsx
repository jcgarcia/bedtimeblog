
import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../../config/api';

export default function SocialMediaManagement() {
	const [socialLinks, setSocialLinks] = useState({
		facebook: '',
		twitter: '',
		instagram: '',
		threads: ''
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState('');

	useEffect(() => {
		fetchSocialLinks();
	}, []);

	const fetchSocialLinks = async () => {
		try {
			const response = await fetch(API_ENDPOINTS.SETTINGS.SOCIAL);
			if (response.ok) {
				const data = await response.json();
				setSocialLinks(data);
			}
		} catch (error) {
			setMessage('Error fetching social links');
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setSocialLinks(prev => ({ ...prev, [name]: value }));
	};

	const handleSave = async () => {
		setSaving(true);
		setMessage('');
		try {
			const response = await fetch(API_ENDPOINTS.SETTINGS.SOCIAL, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(socialLinks)
			});
			if (response.ok) {
				setMessage('Social media links saved!');
				setTimeout(() => setMessage(''), 3000);
			} else {
				setMessage('Error saving social links');
			}
		} catch (error) {
			setMessage('Error saving social links');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="social-management">
			<div className="section-header">
				<h2>Social Media</h2>
				<button className="btn-primary" onClick={handleSave} disabled={saving}>
					{saving ? 'Saving...' : 'Save Links'}
				</button>
			</div>
			{message && (
				<div className={`settings-message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>
			)}
			<div className="social-links-form">
				<div className="form-group">
					<label>Facebook</label>
					<input type="text" name="facebook" value={socialLinks.facebook} onChange={handleInputChange} placeholder="Facebook URL" />
				</div>
				<div className="form-group">
					<label>Twitter</label>
					<input type="text" name="twitter" value={socialLinks.twitter} onChange={handleInputChange} placeholder="Twitter URL" />
				</div>
				<div className="form-group">
					<label>Instagram</label>
					<input type="text" name="instagram" value={socialLinks.instagram} onChange={handleInputChange} placeholder="Instagram URL" />
				</div>
				<div className="form-group">
					<label>Threads</label>
					<input type="text" name="threads" value={socialLinks.threads} onChange={handleInputChange} placeholder="Threads URL" />
				</div>
			</div>
		</div>
	);
}
